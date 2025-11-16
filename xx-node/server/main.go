package main

import (
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	"gitlab.com/elixxir/client/v4/catalog"
	"gitlab.com/elixxir/client/v4/collective/versioned"
	"gitlab.com/elixxir/client/v4/e2e/parse"
	"gitlab.com/elixxir/client/v4/e2e/receive"
	"gitlab.com/elixxir/crypto/e2e"
	"gitlab.com/elixxir/ekv"
	"gitlab.com/elixxir/primitives/format"
	"gitlab.com/xx_network/primitives/id"
)

type ndfDocument struct {
	Cmix struct {
		Prime string `json:"Prime"`
	} `json:"Cmix"`
}

type inboundPart struct {
	SenderID                string  `json:"senderId"`
	PayloadBase64           string  `json:"payload"`
	RelationshipFingerprint string  `json:"relationshipFingerprint,omitempty"`
	MessageTypeOverride     *uint32 `json:"messageType,omitempty"`
	TimestampNsOverride     *int64  `json:"timestampNs,omitempty"`
}

type partResponse struct {
	Accepted         bool   `json:"accepted"`
	Completed        bool   `json:"completed"`
	MessageType      uint32 `json:"messageType"`
	Bytes            int    `json:"bytes"`
	CompletedPayload string `json:"completedPayload,omitempty"`
	Info             string `json:"info,omitempty"`
}

type messageServer struct {
	partitioner *parse.Partitioner
}

func main() {
	addr := flag.String("addr", ":8080", "HTTP listen address")
	ndfPath := flag.String("ndf", "ndf.json", "Path to the NDF JSON used to derive message size")
	flag.Parse()

	maxLen, err := deriveMaxMessageLength(*ndfPath)
	if err != nil {
		log.Fatalf("failed to derive max message length: %v", err)
	}

	kv := versioned.NewKV(ekv.MakeMemstore())
	partitioner := parse.NewPartitioner(kv, maxLen)
	srv := &messageServer{partitioner: partitioner}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/parts", srv.handlePart)

	log.Printf("server ready on %s (max message length %d bytes)", *addr, maxLen)
	if err := http.ListenAndServe(*addr, mux); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}

func (s *messageServer) handlePart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var req inboundPart
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	sender, err := parseSender(req.SenderID)
	if err != nil {
		http.Error(w, fmt.Sprintf("invalid senderId: %v", err), http.StatusBadRequest)
		return
	}

	payload, err := base64.StdEncoding.DecodeString(req.PayloadBase64)
	if err != nil {
		http.Error(w, fmt.Sprintf("invalid payload: %v", err), http.StatusBadRequest)
		return
	}

	var relFp []byte
	if req.RelationshipFingerprint != "" {
		relFp, err = base64.StdEncoding.DecodeString(req.RelationshipFingerprint)
		if err != nil {
			http.Error(w, fmt.Sprintf("invalid relationshipFingerprint: %v", err), http.StatusBadRequest)
			return
		}
	}

	messageType := catalog.MessageType(req.messageType())
	msg, complete := s.processPart(sender, payload, relFp, messageType)

	resp := partResponse{
		Accepted:    true,
		Completed:   complete,
		MessageType: uint32(messageType),
		Bytes:       len(payload),
	}

	if complete {
		resp.CompletedPayload = base64.StdEncoding.EncodeToString(msg.Payload)
		resp.Info = fmt.Sprintf("assembled %d bytes from sender %s", len(msg.Payload), msg.Sender)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (s *messageServer) processPart(sender *id.ID, payload []byte, relationshipFingerprint []byte, overrideType catalog.MessageType) (receive.Message, bool) {
	msg, _, complete := s.partitioner.HandlePartition(sender, payload, relationshipFingerprint, e2e.KeyResidue{})
	if complete && overrideType != 0 {
		msg.MessageType = overrideType
	}
	return msg, complete
}

func (req inboundPart) messageType() uint32 {
	if req.MessageTypeOverride != nil {
		return *req.MessageTypeOverride
	}
	return uint32(catalog.XxMessage)
}

func parseSender(input string) (*id.ID, error) {
	if input == "" {
		return nil, fmt.Errorf("sender ID required")
	}

	raw, err := base64.StdEncoding.DecodeString(input)
	if err != nil {
		return nil, err
	}

	sender, err := id.Unmarshal(raw)
	if err != nil {
		return nil, err
	}

	return sender, nil
}

func deriveMaxMessageLength(ndfPath string) (int, error) {
	data, err := os.ReadFile(ndfPath)
	if err != nil {
		return 0, err
	}

	var doc ndfDocument
	if err := json.Unmarshal(data, &doc); err != nil {
		return 0, err
	}

	if doc.Cmix.Prime == "" {
		return 0, fmt.Errorf("ndf missing cmix prime")
	}

	primeBytes, err := hex.DecodeString(doc.Cmix.Prime)
	if err != nil {
		return 0, fmt.Errorf("invalid prime hex: %w", err)
	}

	msg := format.NewMessage(len(primeBytes))
	return msg.ContentsSize(), nil
}
