package main

import (
	"fmt"
	"io"
	"os"

	"github.com/le0developer/skew-protobuf/gen"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/pluginpb"
)

func main() {
	if err := run(); err != nil {
		// If the error is not set in the response, it will be printed
		// to stderr by protoc.
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	if len(os.Args) > 1 {
		return fmt.Errorf("unknown argument %q (this program should be run by protoc, not directly)", os.Args[1])
	}
	in, err := io.ReadAll(os.Stdin)
	if err != nil {
		return fmt.Errorf("failed to read input: %w", err)
	}
	req := &pluginpb.CodeGeneratorRequest{}
	if err := proto.Unmarshal(in, req); err != nil {
		return fmt.Errorf("failed to unmarshal request: %w", err)
	}

	gen := gen.NewGen()
	resp, err := gen.Generate(req)
	if err != nil {
		return fmt.Errorf("failed to generate code: %w", err)
	}
	out, err := proto.Marshal(resp)
	if err != nil {
		return fmt.Errorf("failed to marshal response: %w", err)
	}
	if _, err := os.Stdout.Write(out); err != nil {
		return fmt.Errorf("failed to write response: %w", err)
	}
	return nil
}
