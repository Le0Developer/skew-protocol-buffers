package gen

import (
	"bytes"
	"fmt"
	"strings"
)

// CodeWriter is a helper for generating code with proper indentation and formatting.
type CodeWriter struct {
	buf         bytes.Buffer
	indentLevel int
	indentStr   string
}

// NewCodeWriter creates a new CodeWriter with the given indent string (e.g. "\t" or "    ").
func NewCodeWriter(indentStr string) *CodeWriter {
	return &CodeWriter{
		indentStr: indentStr,
	}
}

// Indent increases the indentation level.
func (w *CodeWriter) Indent() {
	w.indentLevel++
}

// Dedent decreases the indentation level.
func (w *CodeWriter) Dedent() {
	if w.indentLevel > 0 {
		w.indentLevel--
	}
}

// Write writes a string at the current indentation level, without a newline.
func (w *CodeWriter) Write(s string) {
	if w.indentLevel < 0 {
		panic("indentation level cannot be negative, there's a bug in the code writer")
	}
	w.WriteRaw(strings.Repeat(w.indentStr, w.indentLevel))
	w.WriteRaw(s)
}

// WriteRaw writes a raw string directly to the buffer without indentation.
func (w *CodeWriter) WriteRaw(s string) {
	w.buf.WriteString(s)
}

// WriteLine writes a string at the current indentation level, followed by a newline.
func (w *CodeWriter) WriteLine(s string) {
	if s == "" {
		w.buf.WriteByte('\n')
		return
	}
	trimmed := strings.TrimLeft(s, " \t")

	// surely there's a better way to do this, but this is the simplest
	dedents := len(trimmed) - len(strings.TrimLeft(trimmed, "}"))
	indents := len(trimmed) - len(strings.TrimRight(trimmed, "{"))
	w.indentLevel -= dedents
	w.Write(s)
	w.buf.WriteByte('\n')
	w.indentLevel += indents
}

// Writef writes a formatted string at the current indentation level, without a newline.
func (w *CodeWriter) Writef(format string, args ...any) {
	w.Write(fmt.Sprintf(format, args...))
}

// WriteLinef writes a formatted string at the current indentation level, followed by a newline.
func (w *CodeWriter) WriteLinef(format string, args ...any) {
	w.WriteLine(fmt.Sprintf(format, args...))
}

// String returns the generated code as a string.
func (w *CodeWriter) String() string {
	return w.buf.String()
}

// Reset clears the buffer and indentation level.
func (w *CodeWriter) Reset() {
	w.buf.Reset()
	w.indentLevel = 0
}

// Example usage:
//  cw := NewCodeWriter("    ") // 4-space indentation
//  cw.WriteLine("func main() {")
//  cw.Indent()
//  cw.WriteLine(`fmt.Println("Hello, world!")`)
//  cw.Dedent()
//  cw.WriteLine("}")
//  fmt.Print(cw.String())
