package gen

import (
	"fmt"

	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/descriptorpb"
	"google.golang.org/protobuf/types/pluginpb"
)

type Gen struct {
	W          *CodeWriter
	namespaces []string
	options    Options
}

// Generate processes the CodeGeneratorRequest and produces a CodeGeneratorResponse.
// https://protobuf.dev/reference/cpp/api-docs/google.protobuf.compiler.plugin.pb/
func (g *Gen) Generate(req *pluginpb.CodeGeneratorRequest) (*pluginpb.CodeGeneratorResponse, error) {
	resp := &pluginpb.CodeGeneratorResponse{}

	g.W.WriteLine("# Code generated by protoc-gen-sk. DO NOT EDIT.")

	g.options = defaultOptions()
	params := req.GetParameter()
	if params != "" {
		g.options.parseOptions(params)
		g.W.WriteLinef("# Params: %q", params)
	}

	for _, file := range req.ProtoFile {
		if err := g.generateFile(file); err != nil {
			return nil, fmt.Errorf("error generating file %s: %w", file.GetName(), err)
		}
	}

	// Example of generating a file:
	file := &pluginpb.CodeGeneratorResponse_File{
		Name:    proto.String("output.pb.sk"),
		Content: proto.String(g.W.String()),
	}
	resp.File = append(resp.File, file)
	resp.SupportedFeatures = proto.Uint64(uint64(pluginpb.CodeGeneratorResponse_FEATURE_PROTO3_OPTIONAL | pluginpb.CodeGeneratorResponse_FEATURE_SUPPORTS_EDITIONS))
	resp.MinimumEdition = proto.Int32(int32(descriptorpb.Edition_EDITION_PROTO2))
	resp.MaximumEdition = proto.Int32(int32(descriptorpb.Edition_EDITION_2023))

	return resp, nil
}

func NewGen() *Gen {
	return &Gen{
		W: NewCodeWriter("\t"),
	}
}
