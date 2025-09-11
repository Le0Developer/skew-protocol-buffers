.PHONY: build demo run-demo run-demo-release test test-debug test-compile test-compile-debug test-compile-release test-run install install-local ensure-skewc

build:
	mkdir -p dist
	cat runtime/*.sk > dist/runtime.sk

	go build -o dist/protoc-gen-skew cmd/protoc-gen-skew/main.go

demo: build
	PATH="./dist:${PATH}" protoc --skew_out="ShuffleFields=no:./example/demo" example/demo.proto

run-demo: ensure-skewc demo
	node skewc.js runtime/*.sk example/main.sk example/demo/*.sk tests/stdlib.sk --output-file=example/demo.js --globalize-functions
	node example/demo.js

run-demo-release: ensure-skewc demo
	node skewc.js runtime/*.sk example/main.sk example/demo/*.sk tests/stdlib.sk --output-file=example/demo.js --release
	node example/demo.js

test: test-compile test-run
test-debug: test-compile-debug test-run
test-release: test-compile-release test-run

test-compile: ensure-skewc
	node skewc.js runtime/*.sk tests/*.sk --output-file=tests/test.js --globalize-functions --define:TEST=true

test-compile-debug: ensure-skewc
	node skewc.js runtime/*.sk tests/*.sk --output-file=tests/test.js --globalize-functions --define:TEST=true --define:TEST_DEBUG=true

test-compile-release: ensure-skewc
	node skewc.js runtime/*.sk tests/*.sk --output-file=tests/test.js --release --define:TEST=true

ensure-skewc:
	@if [ ! -f skewc.js ]; then \
		if command -v curl > /dev/null; then \
			curl -sL https://raw.githubusercontent.com/Le0Developer/skew/refs/heads/master/skewc.js -o skewc.js; \
		else \
			wget -q https://raw.githubusercontent.com/Le0Developer/skew/refs/heads/master/skewc.js; \
		fi; \
	fi

test-run:
	node tests/test.js

install:
	GOPRIVATE=github.com/le0developer go install github.com/le0developer/skew-protocol-buffers/cmd/protoc-gen-skew@latest

install-local:
	go install ./cmd/protoc-gen-skew