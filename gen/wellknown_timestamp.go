package gen

import (
	_ "embed"
	"fmt"
	"strings"
)

//go:embed wellknown_timestamp.sk
var wellKnownTimestampSk string

type wellknownTimestamp struct{}

func (wellknownTimestamp) genHelper(w *CodeWriter) {
	for line := range strings.SplitSeq(wellKnownTimestampSk, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed != "" && !strings.HasPrefix(trimmed, "#") {
			w.WriteLine(trimmed)
		}
	}
}

func (wellknownTimestamp) debugSerializer(expr string) string {
	return fmt.Sprintf("%s.asTime.asDate", expr)
}

var _ wellknownHelpers = wellknownTimestamp{}
var _ wellknownDebugSerializer = wellknownTimestamp{}
