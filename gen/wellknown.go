package gen

func (g *Gen) genWellKnownHelper(name string) {
	wellknown := getWellknown(name)
	if helper, ok := wellknown.(wellknownHelpers); ok {
		helper.genHelper(g.W)
	}
}

func isWellknown(typename string) bool {
	switch typename {
	case "google.protobuf.Timestamp", "google.protobuf.Duration":
		return true
	}
	return false
}

func getWellknown(typename string) any {
	switch typename {
	case "google.protobuf.Timestamp":
		return wellknownTimestamp{}
	case "google.protobuf.Duration":
		return wellknownDuration{}
	}
	return nil
}

type wellknownHelpers interface {
	genHelper(w *CodeWriter)
}

type wellknownDebugSerializer interface {
	debugSerializer(expr string) string
}
