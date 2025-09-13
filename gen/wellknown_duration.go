package gen

import (
	_ "embed"
	"fmt"
	"strings"
)

//go:embed wellknown_duration.sk
var wellKnownDurationSk string

type wellknownDuration struct{}

func (wellknownDuration) genHelper(w *CodeWriter) {
	for line := range strings.SplitSeq(wellKnownDurationSk, "\n") {
		w.WriteLine(strings.TrimSpace(line))
	}
}

func (wellknownDuration) debugSerializer(expr string) string {
	return fmt.Sprintf("%s.asDuration", expr)
}

var _ wellknownHelpers = wellknownDuration{}
var _ wellknownDebugSerializer = wellknownDuration{}
