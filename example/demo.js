(function() {
  var __create = Object.create ? Object.create : function(prototype) {
    return {'__proto__': prototype};
  };

  function __extends(derived, base) {
    derived.prototype = __create(base.prototype);
    derived.prototype.constructor = derived;
  }

  var __imul = Math.imul ? Math.imul : function(a, b) {
    return (a * (b >>> 16) << 16) + a * (b & 65535) | 0;
  };

  function assert(truth) {
    if (!truth) {
      throw Error('Assertion failed');
    }
  }

  function main() {
    var x = new tutorial.Person();
    tutorial.Person.setName(x, 'John Doe');
    tutorial.Person.setId(x, 123);
    tutorial.Person.setEmail(x, 'john@doe.com');
    tutorial.Person.setAge(x, 1.85);
    var phone = new tutorial.Person.PhoneNumber();
    tutorial.Person.PhoneNumber.setNumber(phone, '123-456-7890');
    tutorial.Person.PhoneNumber.setType(phone, tutorial.Person.PhoneType.MOBILE);
    tutorial.Person.phones(x).push(phone);
    tutorial.Person.scores(x).push(100);
    tutorial.Person.scores(x).push(150);
    tutorial.Person.scores(x).push(200);
    tutorial.Person.magicNumbers(x).push((1 << 8) - 1 | 0);
    tutorial.Person.magicNumbers(x).push((1 << 16) - 1 | 0);
    tutorial.Person.magicNumbers(x).push((1 << 24) - 1 | 0);
    tutorial.Person.magicNumbers(x).push(-1);
    var marshaled = tutorial.Person.marshal(x);
    in_List.append1(marshaled, [200, 1, 172, 2, 144, 3]);
    console.log(marshaled);
    var y = tutorial.Person.unmarshal2(marshaled);
    console.log('name', tutorial.Person.$name(y));
    console.log('id', tutorial.Person.id(y));
    console.log('email', tutorial.Person.email(y));
    console.log('age', tutorial.Person.age(y));
    console.log('phones', tutorial.Person.phones(y));
    console.log('scores', tutorial.Person.scores(y));
    console.log('lastUpdated', tutorial.Person.lastUpdated(y));
    console.log(y);
    var marshaled2 = tutorial.Person.marshal(y);
    console.log('marshaled2', marshaled2);
    console.log('JSON:', tutorial.Person.marshalJSON(y));
  }

  function some(value) {
    return value;
  }

  function none() {
    return null;
  }

  function StringBuilder() {
    this.buffer = '';
  }

  var Unicode = {};

  Unicode.StringIterator = function() {
    this.value = '';
    this.index = 0;
    this.stop = 0;
  };

  Unicode.StringIterator.reset = function(self, text, start) {
    self.value = text;
    self.index = start;
    self.stop = text.length;
    return self;
  };

  Unicode.StringIterator.nextCodePoint = function(self) {
    if (self.index >= self.stop) {
      return -1;
    }

    var a = in_string.get1(self.value, (self.index = self.index + 1 | 0) + -1 | 0);

    if ((a & 64512) != 55296) {
      return a;
    }

    if (self.index >= self.stop) {
      return -1;
    }

    var b = in_string.get1(self.value, (self.index = self.index + 1 | 0) + -1 | 0);
    return ((a << 10) + b | 0) + ((65536 - (55296 << 10) | 0) - 56320 | 0) | 0;
  };

  var proto = {};

  // https://protobuf.dev/programming-guides/encoding/#structure
  proto.Tag = {
    VARINT: 0,
    I64: 1,
    LEN: 2,
    SGROUP: 3,
    EGROUP: 4,
    I32: 5
  };

  proto.TagLengthValue = {};

  proto.TagLengthValue.tag = function(self) {
    return proto.TagLengthValue.toInt(self) & 7;
  };

  proto.TagLengthValue.fieldNumber = function(self) {
    return proto.TagLengthValue.toInt(self) >> 3;
  };

  proto.TagLengthValue.toInt = function(self) {
    return self;
  };

  proto.TagLengthValue.$new = function(tag, fieldNumber) {
    return fieldNumber << 3 | tag;
  };

  proto.TagLengthValue.fromInt = function(value) {
    return value;
  };

  proto.internal_encoding = {};

  // https://protobuf.dev/programming-guides/encoding/#signed-ints
  proto.internal_encoding.ZigZag = {};

  proto.internal_encoding.ZigZag.encode = function(value) {
    return value << 1 ^ value >> 31;
  };

  proto.internal_encoding.ZigZag.decode = function(value) {
    return value >> 1 ^ -(value & 1);
  };

  proto.internal_encoding.Float = {};

  proto.internal_encoding.Float.encode = function(value) {
    if (isNaN(value)) {
      // NaN in IEEE 754
      return 2143289344;
    }

    else if (!isFinite(value)) {
      // Positive or negative infinity
      return value > 0 ? 2139095040 : -8388608;
    }

    var sign = value < 0 ? 1 : 0;
    var exponent = 0;
    var mantissa = 0;

    if (value != 0) {
      var abs = Math.abs(value);
      exponent = Math.log2(abs) | 0;
      mantissa = abs / Math.pow(2, exponent) - 1;
      exponent = exponent + 127 | 0;
    }

    return sign << 31 | (exponent & 255) << 23 | mantissa * 8388607;
  };

  proto.internal_encoding.Float.decode = function(value) {
    var sign = value >>> 31;
    var exponent = value >>> 23 & 255;
    var mantissa = value & 8388607;

    if (exponent == 255) {
      if (mantissa == 0) {
        return sign == 0 ? in_Math.INFINITY() : -in_Math.INFINITY();
      }

      return in_Math.NAN();
    }

    exponent -= 127;
    return (1 + mantissa / 8388607) * Math.pow(2, exponent) * (1 - __imul(2, sign) | 0);
  };

  proto.ErrorCode = {
    EOF: 0,
    WRONG_TAG: 1
  };

  proto.Reader = function(buffer) {
    this.buffer = buffer;
    this.position = 0;
  };

  proto.Reader.done = function(self) {
    return self.position >= self.buffer.length;
  };

  proto.Reader.read = function(self) {
    return in_List.get(self.buffer, (self.position = self.position + 1 | 0) + -1 | 0);
  };

  proto.Reader.skip = function(self, n) {
    self.position = self.position + n | 0;
  };

  proto.Reader.readVarInt = function(self) {
    var value = 0;
    var shift = 0;

    while (!proto.Reader.done(self) && shift < 35) {
      var byte = proto.Reader.read(self);

      // lester.debug("readVarInt: \(byte) at position \(position - 1) of \(buffer.count) with value \(value) and shift \(shift)")
      value |= (byte & 127) << shift;

      if ((byte & 128) == 0) {
        return value;
      }

      shift = shift + 7 | 0;
    }

    return value;
  };

  proto.Reader.readTag = function(self) {
    return proto.TagLengthValue.fromInt(proto.Reader.readVarInt(self));
  };

  proto.Reader.readInt32 = function(self) {
    if ((self.position + 4 | 0) > self.buffer.length) {
      throw proto.ErrorCode.EOF;
    }

    var value = in_List.get(self.buffer, self.position) | in_List.get(self.buffer, self.position + 1 | 0) << 8 | in_List.get(self.buffer, self.position + 2 | 0) << 16 | in_List.get(self.buffer, self.position + 3 | 0) << 24;
    self.position = self.position + 4 | 0;
    return value;
  };

  proto.Reader.readString = function(self) {
    return in_string.fromCodePoints(encoding.utf8.decode(proto.Reader.readBytes(self)));
  };

  proto.Reader.readBytes = function(self) {
    var length = proto.Reader.readVarInt(self);
    var end = self.position + length | 0;

    if (end < 0 || end > self.buffer.length) {
      throw proto.ErrorCode.EOF;
    }

    var bytes = in_List.slice2(self.buffer, self.position, end);
    self.position = self.position + length | 0;
    return bytes;
  };

  proto.Reader.readRaw = function(self, tag, start) {
    switch (proto.TagLengthValue.tag(tag)) {
      case proto.Tag.VARINT: {
        proto.Reader.readVarInt(self);
        break;
      }

      case proto.Tag.LEN: {
        var length = proto.Reader.readVarInt(self);
        proto.Reader.skip(self, length);
        break;
      }

      case proto.Tag.I32: {
        proto.Reader.skip(self, 4);
        break;
      }

      case proto.Tag.I64: {
        proto.Reader.skip(self, 8);
        break;
      }

      case proto.Tag.SGROUP:
      case proto.Tag.EGROUP: {
        throw proto.ErrorCode.WRONG_TAG;
      }
    }

    return in_List.slice2(self.buffer, start, self.position);
  };

  proto.Writer = {};
  proto.Writer.write1 = function(self, value) {
    self.push(value);
  };

  proto.Writer.write2 = function(self, value) {
    in_List.append1(self, value);
  };

  // https://protobuf.dev/programming-guides/encoding/#varints
  proto.Writer.writeVarInt1 = function(self, value) {
    if (value == 0) {
      proto.Writer.write1(self, 0);
    }

    var remainder = value < 0 ? -1 : 0;

    while (value != 0 || remainder != 0) {
      var byte = value & 127;

      // lester.debug("writeVarInt: value: \(value), byte: \(byte)")
      value = value >>> 7 | (remainder & 127) << 25;
      remainder >>>= 7;

      if (value != 0) {
        byte |= 128;
      }

      proto.Writer.write1(self, byte);
    }
  };

  proto.Writer.writeVarInt2 = function(self, fieldNumber, value) {
    proto.Writer.writeTag(self, proto.TagLengthValue.$new(proto.Tag.VARINT, fieldNumber));
    proto.Writer.writeVarInt1(self, value);
  };

  proto.Writer.writeInt321 = function(self, fieldNumber, value) {
    proto.Writer.writeTag(self, proto.TagLengthValue.$new(proto.Tag.I32, fieldNumber));
    proto.Writer.writeInt322(self, value);
  };

  proto.Writer.writeInt322 = function(self, value) {
    proto.Writer.write2(self, [value & 255, value >> 8 & 255, value >> 16 & 255, value >> 24 & 255]);
  };

  proto.Writer.writeTag = function(self, tag) {
    proto.Writer.writeVarInt1(self, proto.TagLengthValue.toInt(tag));
  };

  proto.Writer.writeString = function(self, fieldNumber, value) {
    proto.Writer.writeBytes(self, fieldNumber, encoding.utf8.encode(in_string.codePoints(value)));
  };

  proto.Writer.writeBytes = function(self, fieldNumber, value) {
    proto.Writer.writeTag(self, proto.TagLengthValue.$new(proto.Tag.LEN, fieldNumber));
    proto.Writer.writeVarInt1(self, value.length);
    proto.Writer.write2(self, value);
  };

  proto.Writer.buffer = function(self) {
    return self;
  };

  proto.Writer.$new = function() {
    return [];
  };

  var google = {};

  // Code generated by protoc-gen-sk. DO NOT EDIT.
  // Params: "ShuffleFields=no"
  // Generated file: google/protobuf/timestamp.proto (google.protobuf)
  google.protobuf = {};

  // message types
  // google.protobuf.Timestamp
  // wellknown
  google.protobuf.Timestamp = function() {
    this.__seconds = none();
    this.__nanos = none();
    this._unknownFields = [];
  };

  // oneofs accessors

  // marshal
  google.protobuf.Timestamp.marshal = function(self) {
    var writer = proto.Writer.$new();

    if (in_Option.isSome(self.__seconds)) {
      proto.Writer.writeVarInt2(writer, 1, in_Option.unwrapUnchecked(self.__seconds));
    }

    if (in_Option.isSome(self.__nanos)) {
      proto.Writer.writeVarInt2(writer, 2, in_Option.unwrapUnchecked(self.__nanos));
    }

    proto.Writer.write2(writer, self._unknownFields);
    return proto.Writer.buffer(writer);
  };

  google.protobuf.Timestamp.marshalJSON = function(self) {
    var result = {};

    if (in_Option.isSome(self.__seconds)) {
      result.seconds = in_Option.unwrapUnchecked(self.__seconds);
    }

    if (in_Option.isSome(self.__nanos)) {
      result.nanos = in_Option.unwrapUnchecked(self.__nanos);
    }

    return result;
  };

  // unmarshal
  google.protobuf.Timestamp.unmarshal1 = function(reader) {
    var message = new google.protobuf.Timestamp();

    while (!proto.Reader.done(reader)) {
      var start = reader.position;
      var tag = proto.Reader.readTag(reader);

      switch (proto.TagLengthValue.fieldNumber(tag)) {
        case 1: {
          assert(proto.TagLengthValue.tag(tag) == proto.Tag.VARINT);
          message.__seconds = some(proto.Reader.readVarInt(reader));
          break;
        }

        case 2: {
          assert(proto.TagLengthValue.tag(tag) == proto.Tag.VARINT);
          message.__nanos = some(proto.Reader.readVarInt(reader));
          break;
        }

        default: {
          in_List.append1(message._unknownFields, proto.Reader.readRaw(reader, tag, start));
          break;
        }
      }
    }

    return message;
  };

  google.protobuf.Timestamp.unmarshal2 = function(buffer) {
    return google.protobuf.Timestamp.unmarshal1(new proto.Reader(buffer));
  };

  // Generated file: example/demo.proto (tutorial)
  var tutorial = {};

  // message types
  // tutorial.Person
  tutorial.Person = function() {
    this.__name = none();
    this.__id = none();
    this.__email = none();
    this.__age = none();
    this.__phones = [];
    this.__lastUpdated = none();
    this.__scores = [];
    this.__imageUrl = none();
    this.__imageData = none();
    this.__magicNumbers = [];
    this._oneof_0 = tutorial.Person.Avatar.None;
    this._unknownFields = [];
  };

  // field accessors
  tutorial.Person.$name = function(self) {
    return self.__name;
  };

  tutorial.Person.setName = function(self, value) {
    self.__name = some(value);
  };

  tutorial.Person.id = function(self) {
    return self.__id;
  };

  tutorial.Person.setId = function(self, value) {
    self.__id = some(value);
  };

  tutorial.Person.email = function(self) {
    return self.__email;
  };

  tutorial.Person.setEmail = function(self, value) {
    self.__email = some(value);
  };

  tutorial.Person.age = function(self) {
    return self.__age;
  };

  tutorial.Person.setAge = function(self, value) {
    self.__age = some(value);
  };

  tutorial.Person.phones = function(self) {
    return self.__phones;
  };

  tutorial.Person.lastUpdated = function(self) {
    return self.__lastUpdated;
  };

  tutorial.Person.scores = function(self) {
    return self.__scores;
  };

  tutorial.Person.magicNumbers = function(self) {
    return self.__magicNumbers;
  };

  // marshal
  tutorial.Person.marshal = function(self) {
    var writer = proto.Writer.$new();

    if (in_Option.isSome(self.__name)) {
      proto.Writer.writeString(writer, 1, in_Option.unwrapUnchecked(self.__name));
    }

    if (in_Option.isSome(self.__id)) {
      proto.Writer.writeVarInt2(writer, 2, in_Option.unwrapUnchecked(self.__id));
    }

    if (in_Option.isSome(self.__email)) {
      proto.Writer.writeString(writer, 3, in_Option.unwrapUnchecked(self.__email));
    }

    if (in_Option.isSome(self.__age)) {
      proto.Writer.writeInt321(writer, 9, proto.internal_encoding.Float.encode(in_Option.unwrapUnchecked(self.__age)));
    }

    if (self.__phones.length > 0) {
      for (var i = 0, list = self.__phones, count = list.length; i < count; i = i + 1 | 0) {
        var item = in_List.get(list, i);
        proto.Writer.writeBytes(writer, 4, tutorial.Person.PhoneNumber.marshal(item));
      }
    }

    if (in_Option.isSome(self.__lastUpdated)) {
      proto.Writer.writeBytes(writer, 5, google.protobuf.Timestamp.marshal(in_Option.unwrapUnchecked(self.__lastUpdated)));
    }

    if (self.__scores.length > 0) {
      if (self.__scores.length == 1) {
        proto.Writer.writeVarInt2(writer, 6, proto.internal_encoding.ZigZag.encode(in_List.get(self.__scores, 0)));
      }

      else {
        var buffer = proto.Writer.$new();

        for (var i1 = 0, list1 = self.__scores, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
          var item1 = in_List.get(list1, i1);
          proto.Writer.writeVarInt1(buffer, proto.internal_encoding.ZigZag.encode(item1));
        }

        proto.Writer.writeBytes(writer, 6, proto.Writer.buffer(buffer));
      }
    }

    if (in_Option.isSome(self.__imageUrl)) {
      proto.Writer.writeString(writer, 7, in_Option.unwrapUnchecked(self.__imageUrl));
    }

    if (in_Option.isSome(self.__imageData)) {
      proto.Writer.writeBytes(writer, 8, in_Option.unwrapUnchecked(self.__imageData));
    }

    if (self.__magicNumbers.length > 0) {
      if (self.__magicNumbers.length == 1) {
        proto.Writer.writeInt321(writer, 10, proto.internal_encoding.ZigZag.encode(in_List.get(self.__magicNumbers, 0)));
      }

      else {
        var buffer1 = proto.Writer.$new();

        for (var i2 = 0, list2 = self.__magicNumbers, count2 = list2.length; i2 < count2; i2 = i2 + 1 | 0) {
          var item2 = in_List.get(list2, i2);
          proto.Writer.writeInt322(buffer1, proto.internal_encoding.ZigZag.encode(item2));
        }

        proto.Writer.writeBytes(writer, 10, proto.Writer.buffer(buffer1));
      }
    }

    proto.Writer.write2(writer, self._unknownFields);
    return proto.Writer.buffer(writer);
  };

  tutorial.Person.marshalJSON = function(self) {
    var result = {};

    if (in_Option.isSome(self.__name)) {
      result.name = in_Option.unwrapUnchecked(self.__name);
    }

    if (in_Option.isSome(self.__id)) {
      result.id = in_Option.unwrapUnchecked(self.__id);
    }

    if (in_Option.isSome(self.__email)) {
      result.email = in_Option.unwrapUnchecked(self.__email);
    }

    if (in_Option.isSome(self.__age)) {
      result.age = in_Option.unwrapUnchecked(self.__age);
    }

    result.phones = self.__phones.map(function(item) {
      return tutorial.Person.PhoneNumber.marshalJSON(item);
    });

    if (in_Option.isSome(self.__lastUpdated)) {
      result.lastUpdated = google.protobuf.Timestamp.marshalJSON(in_Option.unwrapUnchecked(self.__lastUpdated));
    }

    result.scores = self.__scores.map(function(item) {
      return item;
    });

    if (in_Option.isSome(self.__imageUrl)) {
      result.imageUrl = in_Option.unwrapUnchecked(self.__imageUrl);
    }

    if (in_Option.isSome(self.__imageData)) {
      result.imageData = in_Option.unwrapUnchecked(self.__imageData);
    }

    result.magicNumbers = self.__magicNumbers.map(function(item) {
      return item;
    });
    return result;
  };

  // unmarshal
  tutorial.Person.unmarshal1 = function(reader) {
    var message = new tutorial.Person();

    while (!proto.Reader.done(reader)) {
      var start = reader.position;
      var tag = proto.Reader.readTag(reader);

      switch (proto.TagLengthValue.fieldNumber(tag)) {
        case 1: {
          assert(proto.TagLengthValue.tag(tag) == proto.Tag.LEN);
          message.__name = some(proto.Reader.readString(reader));
          break;
        }

        case 2: {
          assert(proto.TagLengthValue.tag(tag) == proto.Tag.VARINT);
          message.__id = some(proto.Reader.readVarInt(reader));
          break;
        }

        case 3: {
          assert(proto.TagLengthValue.tag(tag) == proto.Tag.LEN);
          message.__email = some(proto.Reader.readString(reader));
          break;
        }

        case 9: {
          assert(proto.TagLengthValue.tag(tag) == proto.Tag.I32);
          message.__age = some(proto.internal_encoding.Float.decode(proto.Reader.readInt32(reader)));
          break;
        }

        case 4: {
          assert(proto.TagLengthValue.tag(tag) == proto.Tag.LEN);
          message.__phones.push(tutorial.Person.PhoneNumber.unmarshal2(proto.Reader.readBytes(reader)));
          break;
        }

        case 5: {
          assert(proto.TagLengthValue.tag(tag) == proto.Tag.LEN);
          message.__lastUpdated = some(google.protobuf.Timestamp.unmarshal2(proto.Reader.readBytes(reader)));
          break;
        }

        case 6: {
          if (proto.TagLengthValue.tag(tag) == proto.Tag.LEN) {
            var buffer = new proto.Reader(proto.Reader.readBytes(reader));

            while (!proto.Reader.done(buffer)) {
              tutorial.Person.scores(message).push(proto.internal_encoding.ZigZag.decode(proto.Reader.readVarInt(buffer)));
            }
          }

          else {
            assert(proto.TagLengthValue.tag(tag) == proto.Tag.VARINT);
            message.__scores.push(proto.internal_encoding.ZigZag.decode(proto.Reader.readVarInt(reader)));
          }
          break;
        }

        case 7: {
          assert(proto.TagLengthValue.tag(tag) == proto.Tag.LEN);
          message.__imageUrl = some(proto.Reader.readString(reader));
          message._oneof_0 = tutorial.Person.Avatar.ImageUrl;
          break;
        }

        case 8: {
          assert(proto.TagLengthValue.tag(tag) == proto.Tag.LEN);
          message.__imageData = some(proto.Reader.readBytes(reader));
          message._oneof_0 = tutorial.Person.Avatar.ImageData;
          break;
        }

        case 10: {
          if (proto.TagLengthValue.tag(tag) == proto.Tag.LEN) {
            var buffer1 = new proto.Reader(proto.Reader.readBytes(reader));

            while (!proto.Reader.done(buffer1)) {
              tutorial.Person.magicNumbers(message).push(proto.internal_encoding.ZigZag.decode(proto.Reader.readInt32(buffer1)));
            }
          }

          else {
            assert(proto.TagLengthValue.tag(tag) == proto.Tag.I32);
            message.__magicNumbers.push(proto.internal_encoding.ZigZag.decode(proto.Reader.readInt32(reader)));
          }
          break;
        }

        default: {
          in_List.append1(message._unknownFields, proto.Reader.readRaw(reader, tag, start));
          break;
        }
      }
    }

    return message;
  };

  tutorial.Person.unmarshal2 = function(buffer) {
    return tutorial.Person.unmarshal1(new proto.Reader(buffer));
  };

  // nested message types
  // tutorial.Person.PhoneNumber
  tutorial.Person.PhoneNumber = function() {
    this.__number = none();
    this.__type = none();
    this._unknownFields = [];
  };

  tutorial.Person.PhoneNumber.setNumber = function(self, value) {
    self.__number = some(value);
  };

  tutorial.Person.PhoneNumber.setType = function(self, value) {
    self.__type = some(value);
  };

  // oneofs accessors

  // marshal
  tutorial.Person.PhoneNumber.marshal = function(self) {
    var writer = proto.Writer.$new();

    if (in_Option.isSome(self.__number)) {
      proto.Writer.writeString(writer, 1, in_Option.unwrapUnchecked(self.__number));
    }

    if (in_Option.isSome(self.__type)) {
      proto.Writer.writeVarInt2(writer, 2, in_Option.unwrapUnchecked(self.__type));
    }

    proto.Writer.write2(writer, self._unknownFields);
    return proto.Writer.buffer(writer);
  };

  tutorial.Person.PhoneNumber.marshalJSON = function(self) {
    var result = {};

    if (in_Option.isSome(self.__number)) {
      result.number = in_Option.unwrapUnchecked(self.__number);
    }

    if (in_Option.isSome(self.__type)) {
      result.type = in_List.get(tutorial.Person.in_PhoneType._strings, in_Option.unwrapUnchecked(self.__type));
    }

    return result;
  };

  // unmarshal
  tutorial.Person.PhoneNumber.unmarshal1 = function(reader) {
    var message = new tutorial.Person.PhoneNumber();

    while (!proto.Reader.done(reader)) {
      var start = reader.position;
      var tag = proto.Reader.readTag(reader);

      switch (proto.TagLengthValue.fieldNumber(tag)) {
        case 1: {
          assert(proto.TagLengthValue.tag(tag) == proto.Tag.LEN);
          message.__number = some(proto.Reader.readString(reader));
          break;
        }

        case 2: {
          assert(proto.TagLengthValue.tag(tag) == proto.Tag.VARINT);
          message.__type = some(proto.Reader.readVarInt(reader));
          break;
        }

        default: {
          in_List.append1(message._unknownFields, proto.Reader.readRaw(reader, tag, start));
          break;
        }
      }
    }

    return message;
  };

  tutorial.Person.PhoneNumber.unmarshal2 = function(buffer) {
    return tutorial.Person.PhoneNumber.unmarshal1(new proto.Reader(buffer));
  };

  // wellknown

  // nested enum types
  // enum values
  tutorial.Person.PhoneType = {
    MOBILE: 0
  };

  // oneofs
  tutorial.Person.Avatar = {
    None: 0,
    ImageUrl: 1,
    ImageData: 2
  };

  tutorial.Person.in_PhoneType = {};
  var encoding = {};
  encoding.utf8 = {};

  // utf32 code points to utf8 bytes
  encoding.utf8.encode = function(codePoints) {
    var bytes = [];

    for (var i = 0, list = codePoints, count = list.length; i < count; i = i + 1 | 0) {
      var codePoint = in_List.get(list, i);
      assert(codePoint >= 0 && codePoint < 1114112);

      if (codePoint < 128) {
        bytes.push(codePoint);
      }

      else if (codePoint < 2048) {
        bytes.push(192 | codePoint >> 6);
        bytes.push(128 | codePoint & 63);
      }

      else if (codePoint < 65536) {
        bytes.push(224 | codePoint >> 12);
        bytes.push(128 | codePoint >> 6 & 63);
        bytes.push(128 | codePoint & 63);
      }

      else {
        bytes.push(240 | codePoint >> 18);
        bytes.push(128 | codePoint >> 12 & 63);
        bytes.push(128 | codePoint >> 6 & 63);
        bytes.push(128 | codePoint & 63);
      }
    }

    return bytes;
  };

  // utf8 bytes to utf32 code points
  encoding.utf8.decode = function(bytes) {
    var codePoints = [];
    var i = 0;

    while (i < bytes.length) {
      var byte = in_List.get(bytes, i);

      if (byte < 128) {
        codePoints.push(byte);
        i = i + 1 | 0;
      }

      else if ((byte & 224) == 192) {
        assert((i + 1 | 0) < bytes.length);
        codePoints.push((byte & 31) << 6 | in_List.get(bytes, i + 1 | 0) & 63);
        i = i + 2 | 0;
      }

      else if ((byte & 240) == 224) {
        assert((i + 2 | 0) < bytes.length);
        codePoints.push((byte & 15) << 12 | (in_List.get(bytes, i + 1 | 0) & 63) << 6 | in_List.get(bytes, i + 2 | 0) & 63);
        i = i + 3 | 0;
      }

      else {
        assert((i + 3 | 0) < bytes.length);
        codePoints.push((byte & 7) << 18 | (in_List.get(bytes, i + 1 | 0) & 63) << 12 | (in_List.get(bytes, i + 2 | 0) & 63) << 6 | in_List.get(bytes, i + 3 | 0) & 63);
        i = i + 4 | 0;
      }
    }

    return codePoints;
  };

  var in_List = {};

  in_List.get = function(self, index) {
    assert(0 <= index && index < self.length);
    return self[index];
  };

  in_List.append1 = function(self, values) {
    assert(values != self);

    for (var i = 0, list = values, count1 = list.length; i < count1; i = i + 1 | 0) {
      var value = in_List.get(list, i);
      self.push(value);
    }
  };

  in_List.slice2 = function(self, start, end) {
    assert(0 <= start && start <= end && end <= self.length);
    return self.slice(start, end);
  };

  in_List.$new = function() {
    return [];
  };

  var in_Option = {};

  in_Option.isSome = function(self) {
    return self !== null;
  };

  in_Option.unwrapUnchecked = function(self) {
    return self;
  };

  var in_Math = {};

  in_Math.INFINITY = function() {
    return 1 / 0;
  };

  in_Math.NAN = function() {
    return 0 / 0;
  };

  var in_string = {};

  in_string.fromCodePoints = function(codePoints) {
    var builder = new StringBuilder();

    for (var i = 0, list = codePoints, count1 = list.length; i < count1; i = i + 1 | 0) {
      var codePoint = in_List.get(list, i);
      builder.buffer += in_string.fromCodePoint(codePoint);
    }

    return builder.buffer;
  };

  in_string.codePoints = function(self) {
    var codePoints = [];
    var instance = Unicode.StringIterator.INSTANCE;
    Unicode.StringIterator.reset(instance, self, 0);

    while (true) {
      var codePoint = Unicode.StringIterator.nextCodePoint(instance);

      if (codePoint < 0) {
        return codePoints;
      }

      codePoints.push(codePoint);
    }
  };

  in_string.get1 = function(self, index) {
    assert(0 <= index && index < self.length);
    return self.charCodeAt(index);
  };

  in_string.fromCodePoint = function(codePoint) {
    return codePoint < 65536 ? String.fromCharCode(codePoint) : String.fromCharCode((codePoint - 65536 >> 10) + 55296 | 0) + String.fromCharCode((codePoint - 65536 & (1 << 10) - 1) + 56320 | 0);
  };

  Unicode.StringIterator.INSTANCE = new Unicode.StringIterator();
  tutorial.Person.in_PhoneType._strings = ['MOBILE', 'HOME', 'WORK'];

  main();
})();
