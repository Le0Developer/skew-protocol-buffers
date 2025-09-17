package gen

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"strings"

	"google.golang.org/protobuf/types/descriptorpb"
)

func (g *Gen) generateService(service *descriptorpb.ServiceDescriptorProto) error {
	serviceName := service.GetName()
	fullServiceName := strings.Join(append(g.namespaces, serviceName), ".")

	methods := []serviceMethod{}
	for _, method := range service.Method {
		name := method.GetName()
		inputType := strings.TrimPrefix(method.GetInputType(), ".")
		outputType := strings.TrimPrefix(method.GetOutputType(), ".")

		obfuscatedName := ""
		if g.options.GRPCMethodObfuscation != "" {
			obfuscatedName = name + "Obfuscated"
		}

		methods = append(methods, serviceMethod{
			name:           name,
			fullName:       fullServiceName + "/" + name,
			inputType:      inputType,
			outputType:     outputType,
			skewName:       name + "Name",
			obfuscatedName: obfuscatedName,
		})
	}

	for _, m := range methods {
		g.W.WriteLinef("const %s = %q", m.skewName, m.fullName)
		if m.obfuscatedName != "" {
			obfuscated := hmac.New(sha256.New, []byte(g.options.GRPCMethodObfuscation))
			obfuscated.Write([]byte(m.fullName))
			encoded := base64.RawURLEncoding.EncodeToString(obfuscated.Sum(nil)[:15])
			g.W.WriteLinef("const %s = %q", m.obfuscatedName, encoded)
		}
	}

	g.W.WriteLinef("namespace %sClient {", serviceName)
	for _, m := range methods {
		g.W.WriteLinef("def %s(client proto.rpc.Client, request %s) future.Future<Result<%s, dynamic>> {", m.name, m.inputType, m.outputType)
		g.W.WriteLinef("return client.call(%s, request.marshal).map<Result<%s, dynamic>>((res) => res.map<%s>((body) => %s.unmarshal(body)))", m.obfuscatedOrSkewName(), m.outputType, m.outputType, m.outputType)
		g.W.WriteLine("}")
		g.W.WriteLine("")
	}

	g.W.WriteLine("}")

	g.W.WriteLinef("interface %sServer {", serviceName)
	for _, m := range methods {
		g.W.WriteLinef("def %s(request %s) future.Future<Result<%s, dynamic>>", m.name, m.inputType, m.outputType)
	}
	g.W.WriteLine("}")

	g.W.WriteLinef("def %sServerRouter(name string, body List<int>, impl %sServer) future.Future<Result<List<int>, dynamic>> {", serviceName, serviceName)
	g.W.WriteLinef("switch name {")
	for _, m := range methods {
		if m.obfuscatedName != "" {
			g.W.WriteLinef("case %s, %s {", m.skewName, m.obfuscatedName)
		} else {
			g.W.WriteLinef("case %s {", m.skewName)
		}
		g.W.WriteLinef("var request = %s.unmarshal(body)", m.inputType)
		g.W.WriteLinef("return impl.%s(request).map<Result<List<int>, dynamic>>((res) => res.map<List<int>>((body) => body.marshal))", m.name)
		g.W.WriteLine("}")
	}
	g.W.WriteLine("}")
	g.W.WriteLine("return future.Future<Result<List<int>, dynamic>>.resolved(err<List<int>, dynamic>(proto.rpc.METHOD_NOT_FOUND))")
	g.W.WriteLine("}")

	return nil
}

type serviceMethod struct {
	name       string
	fullName   string
	inputType  string
	outputType string

	skewName       string
	obfuscatedName string
}

func (s serviceMethod) obfuscatedOrSkewName() string {
	if s.obfuscatedName != "" {
		return s.obfuscatedName
	}
	return s.skewName
}
