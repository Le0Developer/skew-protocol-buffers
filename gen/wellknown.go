package gen

func (g *Gen) genWellKnown(name string) {
	switch name {
	case "google.protobuf.Timestamp":
		g.genWellKnownTimestamp()
	case "google.protobuf.Duration":
		g.genWellKnownDuration()
	}
}
