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

  // https://protobuf.dev/programming-guides/encoding/#signed-ints
  proto.zigzag = {};

  proto.zigzag.encode = function(value) {
    return value << 1 ^ value >> 31;
  };

  proto.zigzag.decode = function(value) {
    return value >> 1 ^ -(value & 1);
  };

  proto.$float = {};

  proto.$float.encode = function(value) {
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

  proto.$float.decode = function(value) {
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

  var tests = {};

  tests.main = function() {
    return lester.runTests([
      // tests.testing,
      tests.encoding,
      tests.reader,
      tests.writer
    ]);
  };

  var lester = {};

  lester.describe = function(name, unitFn) {
    var unit = new lester.TestUnit(name, [], [], []);
    unitFn(unit);
    return unit;
  };

  lester.runTests = function(units) {
    var failed = 0;

    for (var i = 0, list = units, count = list.length; i < count; i = i + 1 | 0) {
      var unit = in_List.get(list, i);

      if (lester.TestUnit.run(unit)) {
        failed = failed + 1 | 0;
      }
    }

    if (failed > 0) {
      lester.print('Tests completed with ' + failed.toString() + ' failures.');
      return 1;
    }

    lester.print('All tests passed!');
    return 0;
  };

  lester.print = function(message) {
    // Print the message to the console
    console.log(message);
  };

  lester.Test = function(name, parents, testFn) {
    this.name = name;
    this.parents = parents;
    this.testFn = testFn;
  };

  lester.Test.fullName = function(self) {
    var segments = self.parents.slice();
    segments.push(self.name);
    return segments.join(' > ');
  };

  lester.TestUnit = function(name, parentUnits, tests, units) {
    this.name = name;
    this.parentUnits = parentUnits;
    this.tests = tests;
    this.units = units;
  };

  lester.TestUnit.describe = function(self, name, unitFn) {
    var builder = new lester.TestUnit(name, lester.TestUnit._parentsWithSelf(self), [], []);
    unitFn(builder);
    self.units.push(builder);
  };

  lester.TestUnit.it = function(self, name, testFn) {
    var test = new lester.Test(name, lester.TestUnit._parentsWithSelf(self), testFn);
    self.tests.push(test);
  };

  lester.TestUnit._parentsWithSelf = function(self) {
    var result = self.parentUnits.slice();
    result.push(self.name);
    return result;
  };

  lester.TestUnit.run = function(self) {
    var failed = false;

    if (self.tests.length > 0) {
      lester.print(lester.TestUnit.fullName(self));

      for (var i = 0, list = self.tests, count = list.length; i < count; i = i + 1 | 0) {
        var test = in_List.get(list, i);

        // print("[.] \(test.fullName)")
        try {
          test.testFn(new lester.TestingSuite());
          lester.print('[√] ' + lester.Test.fullName(test));
        }

        catch (e) {
          lester.print('[x] ' + lester.Test.fullName(test) + ' - ' + e);
          failed = true;
        }
      }
    }

    for (var i1 = 0, list1 = self.units, count1 = list1.length; i1 < count1; i1 = i1 + 1 | 0) {
      var unit = in_List.get(list1, i1);

      if (lester.TestUnit.run(unit)) {
        failed = true;
      }
    }

    return failed;
  };

  lester.TestUnit.fullName = function(self) {
    var segments = self.parentUnits.slice();
    segments.push(self.name);
    return segments.join(' > ');
  };

  lester.TestingSuite = function() {
  };

  lester.TestingSuite.equalList = function(self, a, b) {
    if (a.length != b.length) {
      lester.TestingSuite.fail(self, 'Expected ' + a + ' to equal ' + b);
    }

    for (var i = 0, count = a.length; i < count; i = i + 1 | 0) {
      if (in_List.get(a, i) != in_List.get(b, i)) {
        lester.TestingSuite.fail(self, 'Expected ' + a + ' to equal ' + b + ' at index ' + i.toString());
      }
    }
  };

  lester.TestingSuite.equal = function(self, a, b) {
    if (a !== b) {
      lester.TestingSuite.fail(self, 'Expected ' + a + ' to equal ' + b);
    }
  };

  lester.TestingSuite.close = function(self, a, b) {
    var r = a / b;
    var d = Math.abs(a - b);

    if (d > 0.000001 && (r < 0.9999 || r > 1.0001)) {
      lester.TestingSuite.fail(self, 'Expected ' + a.toString() + ' to be close to ' + b.toString() + ' (d=' + d.toString() + ',r=' + r.toString() + ')');
    }
  };

  lester.TestingSuite.truthy = function(self, value) {
    if (!value) {
      lester.TestingSuite.fail(self, 'Expected value to be true');
    }
  };

  lester.TestingSuite.throws = function(self, fn) {
    var threw = false;

    try {
      fn();
    }

    catch (e) {
      threw = true;
    }

    if (!threw) {
      lester.TestingSuite.fail(self, 'Expected function to throw an error');
    }
  };

  lester.TestingSuite.fail = function(self, message) {
    throw 'Test failed: ' + message;
  };

  lester.TestingSuite.fuzz = function(self, fn) {
    var value = 1337;

    for (var i = 0; i < 1000; i = i + 1 | 0) {
      try {
        fn(value);
      }

      catch (e) {
        throw 'Fuzz test failed on iteration ' + i.toString() + ' with value ' + value.toString() + ': ' + e;
      }

      value = __imul(value, -559038737) + -889275714 | 0;
    }
  };

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
  tests.encoding = lester.describe('encoding', function(t) {
    lester.TestUnit.describe(t, 'TagLengthValue', function(unit) {
      lester.TestUnit.it(unit, 'constructor', function(t) {
        var tlv = proto.TagLengthValue.$new(proto.Tag.VARINT, 1);
        lester.TestingSuite.equal(t, proto.TagLengthValue.toInt(tlv), 8);
        lester.TestingSuite.equal(t, proto.TagLengthValue.tag(tlv), proto.Tag.VARINT);
        lester.TestingSuite.equal(t, proto.TagLengthValue.fieldNumber(tlv), 1);
      });
      lester.TestUnit.it(unit, 'from int', function(t) {
        var tlv = proto.TagLengthValue.fromInt(8);
        lester.TestingSuite.equal(t, proto.TagLengthValue.toInt(tlv), 8);
        lester.TestingSuite.equal(t, proto.TagLengthValue.tag(tlv), proto.Tag.VARINT);
        lester.TestingSuite.equal(t, proto.TagLengthValue.fieldNumber(tlv), 1);
      });
    });
    lester.TestUnit.describe(t, 'zigzag', function(unit) {
      lester.TestUnit.it(unit, 'encode', function(t) {
        lester.TestingSuite.equal(t, proto.zigzag.encode(0), 0);
        lester.TestingSuite.equal(t, proto.zigzag.encode(1), 2);
        lester.TestingSuite.equal(t, proto.zigzag.encode(-1), 1);
        lester.TestingSuite.equal(t, proto.zigzag.encode(2), 4);
        lester.TestingSuite.equal(t, proto.zigzag.encode(-2), 3);
      });
      lester.TestUnit.it(unit, 'decode', function(t) {
        lester.TestingSuite.equal(t, proto.zigzag.decode(0), 0);
        lester.TestingSuite.equal(t, proto.zigzag.decode(2), 1);
        lester.TestingSuite.equal(t, proto.zigzag.decode(1), -1);
        lester.TestingSuite.equal(t, proto.zigzag.decode(4), 2);
        lester.TestingSuite.equal(t, proto.zigzag.decode(3), -2);
      });
    });
    lester.TestUnit.describe(t, 'float', function(unit) {
      lester.TestUnit.it(unit, 'encode', function(t) {
        lester.TestingSuite.equal(t, proto.$float.encode(0), 0);
        lester.TestingSuite.equal(t, proto.$float.encode(1), 1065353216);
        lester.TestingSuite.equal(t, proto.$float.encode(-1), -1082130432);
        lester.TestingSuite.equal(t, proto.$float.encode(3.14), 1078523329);
      });
      lester.TestUnit.it(unit, 'decode', function(t) {
        lester.TestingSuite.close(t, proto.$float.decode(0), 0);
        lester.TestingSuite.close(t, proto.$float.decode(1065353216), 1);
        lester.TestingSuite.close(t, proto.$float.decode(-1082130432), -1);
        lester.TestingSuite.close(t, proto.$float.decode(1078523329), 3.14);
      });
      lester.TestUnit.it(unit, 'NAN', function(t) {
        // NaN in IEEE 754
        lester.TestingSuite.equal(t, proto.$float.encode(in_Math.NAN()), 2143289344);

        // NaN in IEEE 754
        lester.TestingSuite.truthy(t, isNaN(proto.$float.decode(2143289344)));

        // Another representation of NaN
        lester.TestingSuite.truthy(t, isNaN(proto.$float.decode(2143289344)));
      });
      lester.TestUnit.it(unit, 'infinity', function(t) {
        // Positive infinity in IEEE 754
        lester.TestingSuite.equal(t, proto.$float.encode(in_Math.INFINITY()), 2139095040);

        // Negative infinity in IEEE 754
        lester.TestingSuite.equal(t, proto.$float.encode(-in_Math.INFINITY()), -8388608);

        // Positive infinity
        lester.TestingSuite.close(t, proto.$float.decode(2139095040), in_Math.INFINITY());

        // Negative infinity
        lester.TestingSuite.close(t, proto.$float.decode(-8388608), -in_Math.INFINITY());
      });
      lester.TestUnit.it(unit, 'fuzz', function(t) {
        // let's make an LSR that encodes and decodes a float
        lester.TestingSuite.fuzz(t, function(v) {
          lester.print('fuzzing float with value: ' + v.toString());
          var encoded = proto.$float.encode(v);
          var decoded = proto.$float.decode(encoded);
          lester.TestingSuite.close(t, decoded, v);
          var encoded2 = proto.$float.encode(decoded);
          var decoded2 = proto.$float.decode(encoded2);
          lester.TestingSuite.close(t, decoded2, decoded);
        });
      });
    });
  });
  tests.reader = lester.describe('reader', function(t) {
    lester.TestUnit.describe(t, 'varint', function(suite) {
      lester.TestUnit.it(suite, 'should decode simple int', function(t) {
        var reader = new proto.Reader([150, 1]);
        lester.TestingSuite.equal(t, proto.Reader.readVarInt(reader), 150);
      });
      lester.TestUnit.it(suite, 'should decode large int', function(t) {
        var reader = new proto.Reader([192, 141, 183, 1]);
        lester.TestingSuite.equal(t, proto.Reader.readVarInt(reader), 3000000);
      });
      lester.TestUnit.it(suite, 'should decode negative int', function(t) {
        var reader = new proto.Reader([255, 255, 255, 255, 15]);
        lester.TestingSuite.equal(t, proto.Reader.readVarInt(reader), -1);
      });
      lester.TestUnit.it(suite, 'should decode 64bit negative int', function(t) {
        var reader = new proto.Reader([255, 255, 255, 255, 255, 255, 255, 1]);
        lester.TestingSuite.equal(t, proto.Reader.readVarInt(reader), -1);
      });
      lester.TestUnit.it(suite, 'should decode -150', function(t) {
        var reader = new proto.Reader([234, 254, 255, 255, 255, 255, 255, 1]);
        lester.TestingSuite.equal(t, proto.Reader.readVarInt(reader), -150);
      });
    });
    lester.TestUnit.describe(t, 'string', function(suite) {
      lester.TestUnit.it(suite, 'should decode hello world', function(t) {
        var reader = new proto.Reader([12, 72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100]);
        lester.TestingSuite.equal(t, proto.Reader.readString(reader), 'Hello, World');
      });
      lester.TestUnit.it(suite, 'should decode utf8', function(t) {
        var reader = new proto.Reader([6, 195, 164, 195, 182, 195, 188]);
        lester.TestingSuite.equal(t, proto.Reader.readString(reader), 'äöü');
      });
      lester.TestUnit.it(suite, 'should decode int32', function(t) {
        var reader = new proto.Reader([1, 0, 0, 0]);
        lester.TestingSuite.equal(t, proto.Reader.readInt32(reader), 1);
      });
      lester.TestUnit.it(suite, 'should decode negative int32', function(t) {
        var reader = new proto.Reader([255, 255, 255, 255]);
        lester.TestingSuite.equal(t, proto.Reader.readInt32(reader), -1);
      });
    });

    // We need to be able to read unknown fields where we don't know the expected tag
    // beforehand.
    lester.TestUnit.describe(t, 'unknown fields', function(suite) {
      lester.TestUnit.it(suite, 'varint', function(t) {
        var reader = new proto.Reader([8, 150, 1]);
        var tag = proto.Reader.readTag(reader);
        lester.TestingSuite.equal(t, proto.TagLengthValue.tag(tag), proto.Tag.VARINT);
        lester.TestingSuite.equal(t, proto.TagLengthValue.fieldNumber(tag), 1);
        var buffer = proto.Reader.readRaw(reader, tag, 0);
        lester.TestingSuite.equalList(t, buffer, reader.buffer);
        lester.TestingSuite.truthy(t, proto.Reader.done(reader));
      });

      // We dont even support parsing 64bit values, but we can still read them just fine
      // so if they're in unknown fields, we can preserve them.
      lester.TestUnit.it(suite, 'i64', function(t) {
        var reader = new proto.Reader([9, 1, 2, 3, 4, 5, 6, 7, 8]);
        var tag = proto.Reader.readTag(reader);
        lester.TestingSuite.equal(t, proto.TagLengthValue.tag(tag), proto.Tag.I64);
        lester.TestingSuite.equal(t, proto.TagLengthValue.fieldNumber(tag), 1);
        var buffer = proto.Reader.readRaw(reader, tag, 0);
        lester.TestingSuite.equalList(t, buffer, reader.buffer);
        lester.TestingSuite.truthy(t, proto.Reader.done(reader));
      });
      lester.TestUnit.it(suite, 'len', function(t) {
        var reader = new proto.Reader([10, 3, 102, 111, 111]);
        var tag = proto.Reader.readTag(reader);
        lester.TestingSuite.equal(t, proto.TagLengthValue.tag(tag), proto.Tag.LEN);
        lester.TestingSuite.equal(t, proto.TagLengthValue.fieldNumber(tag), 1);
        var buffer = proto.Reader.readRaw(reader, tag, 0);
        lester.TestingSuite.equalList(t, buffer, reader.buffer);
        lester.TestingSuite.truthy(t, proto.Reader.done(reader));
      });

      // Groups are not supported and should throw
      lester.TestUnit.it(suite, 'sgroup', function(t) {
        var reader = new proto.Reader([11, 1, 2, 3]);
        var tag = proto.Reader.readTag(reader);
        lester.TestingSuite.equal(t, proto.TagLengthValue.tag(tag), proto.Tag.SGROUP);
        lester.TestingSuite.equal(t, proto.TagLengthValue.fieldNumber(tag), 1);
        lester.TestingSuite.throws(t, function() {
          proto.Reader.readRaw(reader, tag, 0);
        });
      });
      lester.TestUnit.it(suite, 'i32', function(t) {
        var reader = new proto.Reader([13, 1, 0, 0, 0]);
        var tag = proto.Reader.readTag(reader);
        lester.TestingSuite.equal(t, proto.TagLengthValue.tag(tag), proto.Tag.I32);
        lester.TestingSuite.equal(t, proto.TagLengthValue.fieldNumber(tag), 1);
        var buffer = proto.Reader.readRaw(reader, tag, 0);
        lester.TestingSuite.equalList(t, buffer, reader.buffer);
        lester.TestingSuite.truthy(t, proto.Reader.done(reader));
      });
    });
  });
  tests.writer = lester.describe('writer', function(t) {
    lester.TestUnit.describe(t, 'raw varint', function(suite) {
      lester.TestUnit.it(suite, 'should encode 0', function(t) {
        var writer = proto.Writer.$new();
        proto.Writer.writeVarInt1(writer, 0);
        lester.TestingSuite.equalList(t, proto.Writer.buffer(writer), [0]);
      });
      lester.TestUnit.it(suite, 'should encode simple int', function(t) {
        var writer = proto.Writer.$new();
        proto.Writer.writeVarInt1(writer, 150);
        lester.TestingSuite.equalList(t, proto.Writer.buffer(writer), [150, 1]);
      });
      lester.TestUnit.it(suite, 'should encode large int', function(t) {
        var writer = proto.Writer.$new();
        proto.Writer.writeVarInt1(writer, 3000000);
        lester.TestingSuite.equalList(t, proto.Writer.buffer(writer), [192, 141, 183, 1]);
      });
      lester.TestUnit.it(suite, 'should encode negative int', function(t) {
        var writer = proto.Writer.$new();
        proto.Writer.writeVarInt1(writer, -1);
        lester.TestingSuite.equalList(t, proto.Writer.buffer(writer), [255, 255, 255, 255, 255, 255, 255, 255, 255, 1]);
      });
      lester.TestUnit.it(suite, 'should encode -150', function(t) {
        var writer = proto.Writer.$new();
        proto.Writer.writeVarInt1(writer, -150);
        lester.TestingSuite.equalList(t, proto.Writer.buffer(writer), [234, 254, 255, 255, 255, 255, 255, 255, 255, 1]);
      });
    });
    lester.TestUnit.describe(t, 'varint', function(suite) {
      lester.TestUnit.it(suite, 'should encode simple int', function(t) {
        var writer = proto.Writer.$new();
        proto.Writer.writeVarInt2(writer, 1, 150);
        lester.TestingSuite.equalList(t, proto.Writer.buffer(writer), [8, 150, 1]);
      });
    });
    lester.TestUnit.describe(t, 'string', function(suite) {
      lester.TestUnit.it(suite, 'should encode simple string', function(t) {
        var writer = proto.Writer.$new();
        proto.Writer.writeString(writer, 1, 'Hello');
        lester.TestingSuite.equalList(t, proto.Writer.buffer(writer), [10, 5, 72, 101, 108, 108, 111]);
      });
      lester.TestUnit.it(suite, 'should encode empty string', function(t) {
        var writer = proto.Writer.$new();
        proto.Writer.writeString(writer, 1, '');
        lester.TestingSuite.equalList(t, proto.Writer.buffer(writer), [10, 0]);
      });
      lester.TestUnit.it(suite, 'should encode string with special characters', function(t) {
        var writer = proto.Writer.$new();
        proto.Writer.writeString(writer, 1, 'Hello, 世界');
        lester.TestingSuite.equalList(t, proto.Writer.buffer(writer), [10, 13, 72, 101, 108, 108, 111, 44, 32, 228, 184, 150, 231, 149, 140]);
      });
    });
  });

  process.exit(tests.main());
})();
