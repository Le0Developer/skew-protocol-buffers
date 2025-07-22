# protoc

A protocol-buffers implementation in Skew.

## Pre-requisites

You need to have the protoc compiler and [Go](https://go.dev/) installed on your system. You can download the protoc compiler from [here](https://github.com/protocolbuffers/protobuf#protobuf-compiler-installation).

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/le0developer/skew-protocol-buffers.git
   cd skew-protocol-buffers
   ```

2. Run the Makefile to build the project:

   ```bash
   make
   ```

3. Install the protoc-gen-skew plugin (or copy the file from `dist/` to your `$GOPATH/bin`):

   ```bash
   go install github.com/le0developer/skew-protocol-buffers/cmd/protoc-gen-skew@latest
   ```

4. Copy the `dist/runtime.sk` file to your project directory. It contains the runtime definitions needed to work with protocol buffers in Skew.
5. You also need to [skew-vendor](https://github.com/Le0Developer/skew-vendor) to your project directory.

## Usage

To use the `protoc-gen-skew` plugin, you need to generate Skew code from your `.proto` files. You can do this by running the following command:

```bash
protoc --skew_out=. your_proto_file.proto
```

## Options

You can pass options to the `protoc` compiler which will modify the generated code.
A full list of options and their descriptions can be found in the [gen/options.go](gen/options.go) file.

The options are passed when invoking the `protoc` command in the `--skew_out` flag before the output directory separated by a colon `:`:

```bash
protoc --skew_out="PreserveUnknownFields=no:." your_proto_file.proto
```

Multiple options can be passed by separating them with a comma `,`.

A preceding `!` will disable the option, otherwise it will be enabled by default.
