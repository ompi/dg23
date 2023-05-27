var makerjs = require('makerjs');

if (typeof document  === 'undefined') {
  var geom = require('./geometry.js').geom;
  var spool = require('./spool.js').spool;
  var kicad = require('./kicad.js').kicad;
}

function board() {
  models = [];
  paths = [];

  kicadData = "";

  kicad.setRules({
    minTraceSpacing: 150e-3,
    minTraceWidth: 150e-3,
    minTraceToBoardEdgre: 250e-3,

    minHoleDiameter: 300e-3,
    minPadDiameter: 300e-3,
  });

  var rules = kicad.getRules();

  function bus(traces, layer) {
    traces.forEach((trace) => {
      var t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
      trace.forEach((s) => {
        spool.windTrace(t, kicad.getSpool(s[0]), s[1]);
      });
      paths = paths.concat(t.paths);
      kicadData += kicad.trace2kicadTrace(t, layer);
    });
  }

  function logo() {
    var logoData = [ [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, ],
                     [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, ],
                     [ 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, ],
                     [ 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, ],
                     [ 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, ],
                     [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, ],
                     [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, ] ];

    for (var j = 0; j < logoData.length; j++) {
      for (var i = 0; i < logoData[j].length; i++) {
        if (logoData[j][logoData[j].length - i - 1]) {
          var rStep = (rs[7] - rs[4]) / logoData.length;
          var aStep = rStep / ((rs[7] + rs[4]) / 2);
          var ba = new banana(rs[4] + rStep * j, rs[4] + rStep * (j + 1), aStep * i - sa * 1.75, aStep * (i + 1) - sa * 1.75);
          models.push(ba);
          kicadData += kicad.model2kicadPolygon(ba, "B.SilkS", 0.050);
        }
      }
    }
  }

//  logo();

  const vccWidth = 1.6;

  function nets() {
    const ns = [
      "VCC", "GND",

      "#RESET", "RESET", "#EN", "CLK", "STOP", "BUTTON",
      "TRIGGER_STOP", "TRIGGER_LOOP",
      "LOOPQ", "STOPQ",
      "SRQ", "#SRQ",

      "CNT0", "CNT1", "CNT2", "CNT3",

      "COL0", "COL1", "COL2", "COL3", "COL4", "COL5", "COL6", "COL7",
      "COL8", "COL9", "COL10", "COL11", "COL12", "COL13", "COL14", "COL15",

      "ROW0", "ROW1", "ROW2", "ROW3", "ROW4", "ROW5",

      "1CLK", "1CLR", "1QA(LSB)", "1QB", "1QC", "1QD(MSB)",
      "2QD(MSB)", "2QC", "2QB", "2QA(LSB)", "2CLR", "2CLK",

      "1A", "1B", "1Y", "2A", "2B", "2Y",
      "3Y", "3A", "3B", "4Y", "4A", "4B",

      "#1RD", "1D", "1CP", "#1SD", "1Q", "#1Q",
      "#2Q", "2Q", "#2SD", "2CP", "2D", "#2RD",

      "1A", "1Y", "2A", "2Y", "3A", "3Y",
      "4Y", "4A", "5Y", "5A", "6Y", "6A"	
    ];

    ns.forEach((n) => {
      kicad.addNet(n);
    });
  }

  function components() {
    const sn74hc138 = [ "A(LSB)", "B", "C(MSB)", "#G2A", "#G2B", "G1", "Y7(MSB)", "GND",
                        "Y6", "Y5", "Y4", "Y3", "Y2", "Y1", "Y0(LSB)", "VCC" ] // decoder

    const sn74hc393 = [ "1CLK", "1CLR", "1QA(LSB)", "1QB", "1QC", "1QD(MSB)", "GND",
                        "2QD(MSB)", "2QC", "2QB", "2QA(LSB)", "2CLR", "2CLK", "VCC" ] // counter

    const sn74hc74 = [ "#1RD", "1D", "1CP", "#1SD", "1Q", "#1Q", "GND",
                        "#2Q", "2Q", "#2SD", "2CP", "2D", "#2RD", "VCC" ] // D flip-flop

    const sn74hc00 = [ "1A", "1B", "1Y", "2A", "2B", "2Y", "GND",
                       "3Y", "3A", "3B", "4Y", "4A", "4B", "VCC" ] // NAND

    const sn74hc02 = [ "1Y", "1A", "1B", "2Y", "2A", "2B", "GND",
                       "3A", "3B", "3Y", "4A", "4B", "4Y", "VCC" ] // NOR

    const sn74hc04 = [ "1A", "1Y", "2A", "2Y", "3A", "3Y", "GND",
                       "4Y", "4A", "5Y", "5A", "6Y", "6A", "VCC" ] // NOT

    const lm339n = [ "1OUT", "2OUT", "VCC", "2IN-", "2IN+", "1IN-", "1IN+",
                     "3IN-", "3IN+", "4IN-", "4IN+", "GND", "OUT4", "OUT3" ] // opamp

    const dip14 = [ "1", "2", "3", "4", "5", "6", "7",
                    "8", "9", "10", "11", "12", "13", "14" ]

    const dip16 = [ "1", "2", "3", "4", "5", "6", "7", "8",
                    "9", "10", "11", "12", "13", "14", "15", "16" ]

//                                         s1     s1
    const u1 = [ "CNT0", "CNT1", "CNT2", "#EN", "CNT3", "VCC", "COL7", "GND",
                 "COL6", "COL5", "COL4", "COL3", "COL2", "COL1", "COL0", "VCC" ] // decoder
    var chip = new kicad.packageDip16("U1", 0, 0, 90, false, u1);
    models.push(chip);
    kicadData += chip.kicadData;

    var cap = new kicad.packageThd2P("C1", -4.5 * 2.54, 2.54, 270, false, ["VCC", "GND"]);
    models.push(cap);
    kicadData += cap.kicadData;

//                                         s1     s1
    const u2 = [ "CNT0", "CNT1", "CNT2", "#EN", "GND", "CNT3", "COL15", "GND",
                 "COL14", "COL13", "COL12", "COL11", "COL10", "COL9", "COL8", "VCC" ] // decoder
    var chip = new kicad.packageDip16("U2", 9 * 2.54, 0, 90, false, u2);
    models.push(chip);
    kicadData += chip.kicadData;

    var cap = new kicad.packageThd2P("C2", 4.5 * 2.54, 2.54, 270, false, ["VCC", "GND"]);
    models.push(cap);
    kicadData += cap.kicadData;

    const u3 = [ "CLK", "#RESET", "CNT0", "CNT1", "CNT2", "CNT3", "GND",
                  "2QD(MSB)", "2QC", "2QB", "2QA(LSB)", "GND", "2CLK", "VCC" ] // counter
    var chip = new kicad.packageDip14("U3", -0.5 * 2.54, 4 * 2.54, 90, false, u3);
    models.push(chip);
    kicadData += chip.kicadData;

    var cap = new kicad.packageThd2P("C3", -4.5 * 2.54, 5 * 2.54, 270, false, ["VCC", "GND"]);
    models.push(cap);
    kicadData += cap.kicadData;

//                  s1       s1              s4        s4
    const u4 = [ "#RESET", "#SRQ", "SRQ", "BUTTON", "LOOPQ", "RESET", "GND",
                 "#EN", "BUTTON", "SRQ", "#SRQ", "SRQ", "STOP", "VCC" ] // NAND
//                          s3     s3             s2     s2
    var chip = new kicad.packageDip14("U4", -0.5 * 2.54, 8 * 2.54, 90, false, u4);
    models.push(chip);
    kicadData += chip.kicadData;

    var cap = new kicad.packageThd2P("C4", -4.5 * 2.54, 9 * 2.54, 270, false, ["VCC", "GND"]);
    models.push(cap);
    kicadData += cap.kicadData;

    var res = new kicad.packageThd2P("R3", -4.5 * 2.54, 7 * 2.54, 90, false, ["VCC", "BUTTON"]);
    models.push(res);
    kicadData += res.kicadData;

    const u5 = [ "VCC", "GND", "TRIGGER_LOOP", "#RESET", "LOOPQ", "#1Q", "GND",
                 "#2Q", "STOP", "#RESET", "TRIGGER_STOP", "GND", "VCC", "VCC" ] // D flip-flop
    var chip = new kicad.packageDip14("U5", 7.5 * 2.54, 8 * 2.54, 90, false, u5);
    models.push(chip);
    kicadData += chip.kicadData;

    var cap = new kicad.packageThd2P("C5", 3.5 * 2.54, 9 * 2.54, 270, false, ["VCC", "GND"]);
    models.push(cap);
    kicadData += cap.kicadData;

    var res = new kicad.packageThd2P("R1", 11.5 * 2.54, 9 * 2.54, 270, false, ["VCC", "TRIGGER_STOP"]);
    models.push(res);
    kicadData += res.kicadData;

    var res = new kicad.packageThd2P("R2", 11.5 * 2.54, 7 * 2.54, 90, false, ["VCC", "TRIGGER_LOOP"]);
    models.push(res);
    kicadData += res.kicadData;

    const u6 = [ "1A", "1Y", "2A", "2Y", "3A", "3Y", "GND",
                 "4Y", "4A", "5Y", "5A", "#RESET", "RESET", "VCC" ] // NOT
    var chip = new kicad.packageDip14("U6", 7.5 * 2.54, 4 * 2.54, 90, false, u6);
    models.push(chip);
    kicadData += chip.kicadData;

    var cap = new kicad.packageThd2P("C6", 3.5 * 2.54, 5 * 2.54, 270, false, ["VCC", "GND"]);
    models.push(cap);
    kicadData += cap.kicadData;

    for (var i = 0; i < 5; i++) {
      const px = 120;
      const py = -42;
      const vo = 15;

      var res = new kicad.potRk09(`R${i + 5}`, px, py + i * vo, 270, false, [ "GND", "GND", "GND", "GND", "GND" ]);
      models.push(res);
      kicadData += res.kicadData;
    }

    // ROW PULLUPS
    for (var i = 0; i < 6; i++) {
      const px = 13.5 * 2.54;
      const py = -1 * 2.54;
      const ho = 2.54;
      var res = new kicad.packageThd2P(`R${i + 10}`, px + i * ho, py, 270, false, [ "VCC", `ROW${i}` ]);
      models.push(res);
      kicadData += res.kicadData;
    }

    // CNTS
    for (var i = 0; i < 3; i++) {
      var v = new kicad.via(`VCNT${i}`, [i * 2.54 - 3.5 * 2.54, 0 * 2.54], `CNT${i}`);
      paths = paths.concat(v.paths);
      kicadData += v.kicadData;
    }
    var v = new kicad.via("VCNT3", [0.5 * 2.54, 0 * 2.54], "CNT3");
    paths = paths.concat(v.paths);
    kicadData += v.kicadData;

    // #EN
    var v = new kicad.via("VEN", [-0.5 * 2.54, 0 * 2.54], "#EN");
    paths = paths.concat(v.paths);
    kicadData += v.kicadData;
  }

  function top() {
    // COLS
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool("U1.P7.C"), 0);
    spool.windTrace(t, kicad.getSpool("X1.P8.C"), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool(`U2.P7.C`), 1);
    spool.windTrace(t, kicad.getSpool(`X1.P16.C`), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    b = [];
    bus([
      [ ['VCNT0.C', 0], ['VCNT1.T', 0], ['U1.P8.T', 1], ['U2.P1.C', 0] ],
      [ ['VCNT1.C', 0], ['VCNT2.T', 0], ['U2.P1.T', 1], ['U2.P2.C', 0] ],
      [ ['VCNT2.C', 0], ['VEN.T', 0],   ['U2.P2.T', 1], ['U2.P3.C', 0] ],
      [ ['VEN.C', 0],   ['VCNT3.T', 0], ['U2.P3.T', 1], ['U2.P4.C', 0] ],
      [ ['VCNT3.C', 0], ['U2.P5.T', 1], ['U2.P6.C', 0] ]
    ], "F.Cu");

    // LOOPQ
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U4.P5.C'), 0);
    spool.windTrace(t, kicad.getSpool('U4.P6.T'), 0);
    spool.windTrace(t, kicad.getSpool('U5.P4.T'), 0);
    spool.windTrace(t, kicad.getSpool('U5.P5.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    // STOP
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U4.P13.C'), 0);
    spool.windTrace(t, kicad.getSpool('U4.P12.T'), 1);
    spool.windTrace(t, kicad.getSpool('U5.P10.T'), 1);
    spool.windTrace(t, kicad.getSpool('U5.P9.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    // TRIGGER_LOOP
    kicad.getSpool('U5.P4.T').r = 1.6 / 2;
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U5.P3.C'), 0);
    spool.windTrace(t, kicad.getSpool('U5.P4.T'), 1);
    spool.windTrace(t, kicad.getSpool('R2.P2.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    // TRIGGER_STOP
    kicad.getSpool('U5.P10.T').r = 1.6 / 2;
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U5.P11.C'), 0);
    spool.windTrace(t, kicad.getSpool('U5.P10.T'), 0);
    spool.windTrace(t, kicad.getSpool('R1.P2.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    // #RESET
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U6.P13.C'), 0);
    spool.windTrace(t, kicad.getSpool('U6.P14.T'), 0);
    spool.windTrace(t, kicad.getSpool('U4.P6.T'), 1);
    spool.windTrace(t, kicad.getSpool('U4.P5.T'), 1);
    spool.windTrace(t, kicad.getSpool('U4.P6.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U3.P2.C'), 0);
    spool.windTrace(t, kicad.getSpool('U3.P3.T'), 1);
    spool.windTrace(t, kicad.getSpool('C6.P2.T'), 0);
    spool.windTrace(t, kicad.getSpool('U6.P12.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    // BUTTON
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('R3.P2.C'), 0);
    spool.windTrace(t, kicad.getSpool('U4.P3.T'), 1);
    spool.windTrace(t, kicad.getSpool('U4.P4.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    // VCC
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U5.P13.C'), 0);
    spool.windTrace(t, kicad.getSpool('U5.P14.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    t = { traceWidth: vccWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U5.P14.C'), 0);
    spool.windTrace(t, kicad.getSpool('C5.P1.C'), 0);
    spool.windTrace(t, kicad.getSpool('U4.P8.T'), 1);
    spool.windTrace(t, kicad.getSpool('U4.P13.T'), 1);
    spool.windTrace(t, kicad.getSpool('U4.P14.C'), 1);
    spool.windTrace(t, kicad.getSpool('C4.P1.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    t = { traceWidth: vccWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U6.P14.C'), 0);
    spool.windTrace(t, kicad.getSpool('C6.P1.C'), 0);
    spool.windTrace(t, kicad.getSpool('U3.P8.T'), 1);
    spool.windTrace(t, kicad.getSpool('U3.P13.T'), 1);
    spool.windTrace(t, kicad.getSpool('U3.P14.C'), 1);
    spool.windTrace(t, kicad.getSpool('C3.P1.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    t = { traceWidth: vccWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U2.P16.C'), 0);
    spool.windTrace(t, kicad.getSpool('C2.P1.C'), 0);
    spool.windTrace(t, kicad.getSpool('U1.P9.T'), 1);
    spool.windTrace(t, kicad.getSpool('U1.P15.T'), 1);
    spool.windTrace(t, kicad.getSpool('U1.P16.C'), 1);
    spool.windTrace(t, kicad.getSpool('C1.P1.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");
    // unwind U1.P15.T
    kicad.getSpool('U1.P15.T').r -= vccWidth + rules.minTraceSpacing;

    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U1.P6.C'), 0);
    spool.windTrace(t, kicad.getSpool('U1.P5.T'), 0);
    spool.windTrace(t, kicad.getSpool('VCNT0.T'), 1);
    spool.windTrace(t, kicad.getSpool('U1.P16.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    t = { traceWidth: vccWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U2.P16.C'), 0);
    spool.windTrace(t, kicad.getSpool('U2.P15.T'), 0);
    spool.windTrace(t, kicad.getSpool(`R10.P1.C`), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    // VCC-ROWS
    for (var i = 0; i < 5; i++) {
      t = { traceWidth: vccWidth, minTraceSpacing: rules.minTraceSpacing };
      spool.windTrace(t, kicad.getSpool(`R${10 + i}.P1.C`), 0);
      spool.windTrace(t, kicad.getSpool(`R${11 + i}.P1.C`), 0);
      paths = paths.concat(t.paths);
      kicadData += kicad.trace2kicadTrace(t, "F.Cu");
    }
  }

  function bottom() {
    // COLS
    kicad.getSpool(`VCNT1.T`).r = 0.3;
    kicad.getSpool(`VCNT2.T`).r = 0.3;
    kicad.getSpool(`VCNT3.T`).r = 0.3;
    kicad.getSpool(`VEN.T`).r = 0.3;
    kicad.getSpool(`U1.P5.T`).r = 1.6 / 2;
    kicad.getSpool(`U1.P8.T`).r = 1.6 / 2;
    kicad.getSpool(`U2.P1.T`).r = 1.6 / 2;
    kicad.getSpool(`U2.P2.T`).r = 1.6 / 2;
    kicad.getSpool(`U2.P3.T`).r = 1.6 / 2;
    kicad.getSpool(`U2.P5.T`).r = 1.6 / 2;

    bus([
      [ [`U1.P15.C`, 0], [`VCNT1.T`, 0], [`U1.P2.T`, 0], [`X1.P1.C`, 0] ],
      [ [`U1.P14.C`, 0], [`VCNT2.T`, 0], [`U1.P3.T`, 0], [`X1.P2.C`, 0] ],
      [ [`U1.P13.C`, 0], [`VEN.T`, 0],   [`U1.P4.T`, 0], [`X1.P3.C`, 0] ],
      [ [`U1.P12.C`, 0], [`VCNT3.T`, 0], [`U1.P5.T`, 0], [`X1.P4.C`, 0] ],
    ], "B.Cu");

    for (var i = 4; i < 7; i++) {
      t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
      spool.windTrace(t, kicad.getSpool(`U1.P${15 - i}.C`), 0);
      spool.windTrace(t, kicad.getSpool(`U1.P${i + 2}.T`), 0);
      spool.windTrace(t, kicad.getSpool(`X1.P${i + 1}.C`), 0);
      paths = paths.concat(t.paths);
      kicadData += kicad.trace2kicadTrace(t, "B.Cu");
    }

    for (var i = 0; i < 7; i++) {
      t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
      spool.windTrace(t, kicad.getSpool(`U2.P${15 - i}.C`), 0);
      spool.windTrace(t, kicad.getSpool(`U2.P${i + 1}.T`), 1);
      spool.windTrace(t, kicad.getSpool(`X1.P${i + 9}.C`), 0);
      paths = paths.concat(t.paths);
      kicadData += kicad.trace2kicadTrace(t, "B.Cu");
    }

    // ROWS
    for (var i = 0; i < 6; i++) {
      t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
      spool.windTrace(t, kicad.getSpool(`R${10 + i}.P2.C`), 0);
      spool.windTrace(t, kicad.getSpool(`X1.P${i + 17}.C`), 0);
      paths = paths.concat(t.paths);
      kicadData += kicad.trace2kicadTrace(t, "B.Cu");
    }

    // CNTS
    for (var i = 0; i < 3; i++) {
      t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
      spool.windTrace(t, kicad.getSpool(`U3.P${i + 3}.C`), 0);
      spool.windTrace(t, kicad.getSpool(`U1.P${15 - i}.T`), 0);
      spool.windTrace(t, kicad.getSpool(`VCNT${i}.C`), 0);
      spool.windTrace(t, kicad.getSpool(`U1.P${i + 1}.C`), 0);
      paths = paths.concat(t.paths);
      kicadData += kicad.trace2kicadTrace(t, "B.Cu");
    } 

    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool("U3.P6.C"), 0);
    spool.windTrace(t, kicad.getSpool("U1.P11.T"), 0);
    spool.windTrace(t, kicad.getSpool("VCNT3.C"), 0);
    spool.windTrace(t, kicad.getSpool("U1.P5.C"), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "B.Cu");

    // BUTTON
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool("U4.P4.C"), 0);
    spool.windTrace(t, kicad.getSpool("U4.P9.C"), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "B.Cu");

    // #SRQ
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool("U4.P2.C"), 0);
    spool.windTrace(t, kicad.getSpool("U4.P11.C"), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "B.Cu");

    // SRQ
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool("U4.P3.C"), 0);
    spool.windTrace(t, kicad.getSpool("U4.P10.C"), 0);
    spool.windTrace(t, kicad.getSpool("U4.P11.T"), 0);
    spool.windTrace(t, kicad.getSpool("U4.P12.C"), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "B.Cu");

    // #EN
    kicad.getSpool("U4.P6.T").r = 1.6 / 2;
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool("U4.P8.C"), 0);
    spool.windTrace(t, kicad.getSpool("U4.P6.T"), 0);
    spool.windTrace(t, kicad.getSpool("U3.P5.T"), 1);
    spool.windTrace(t, kicad.getSpool("U1.P12.T"), 0);
    spool.windTrace(t, kicad.getSpool("VEN.C"), 0);
    spool.windTrace(t, kicad.getSpool("U1.P4.C"), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "B.Cu");

    // #RESET
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U5.P4.C'), 0);
    spool.windTrace(t, kicad.getSpool('U5.P10.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "B.Cu");

    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U4.P1.C'), 0);
    spool.windTrace(t, kicad.getSpool('U3.P14.T'), 1);
    spool.windTrace(t, kicad.getSpool('U3.P2.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "B.Cu");

    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U5.P4.C'), 0);
    spool.windTrace(t, kicad.getSpool('U6.P12.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "B.Cu");

    // VCC
    t = { traceWidth: vccWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('C1.P1.C'), 0);
    spool.windTrace(t, kicad.getSpool('C3.P2.T'), 1);
    spool.windTrace(t, kicad.getSpool('C3.P1.C'), 0);
    spool.windTrace(t, kicad.getSpool('R3.P1.C'), 0);
    spool.windTrace(t, kicad.getSpool('R3.P2.T'), 1);
    spool.windTrace(t, kicad.getSpool('C4.P2.T'), 1);
    spool.windTrace(t, kicad.getSpool('C4.P1.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "B.Cu");

    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U6.P14.C'), 0);
    spool.windTrace(t, kicad.getSpool('U5.P1.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "B.Cu");
  }

  matrixOrigin = { x: -4.5 * 2.54, y: -22 * 2.54 };
  matrixConnectorOrigin = { x: -2.5 * 2.54, y: -3 * 2.54 };

  function matrix() {
    for (var i = 0; i < 16; i++) {
      for (var j = 0; j < 6; j++) {
        var h = new kicad.matrixHole(`H${i}_${j}`, [ i * 8 + matrixOrigin.x, j * 8 + matrixOrigin.y ], `COL${i}`);
        models.push(h);
        paths = paths.concat(h.paths);
        kicadData += h.kicadData;
      }
    }

    var h = new kicad.matrixHole(`HTRIGGER_STOP`, [ 16 * 8 + matrixOrigin.x, matrixOrigin.y ], `TRIGGER_STOP`);
    models.push(h);
    paths = paths.concat(h.paths);
    kicadData += h.kicadData;

    var h = new kicad.matrixHole(`HTRIGGER_LOOP`, [ 17 * 8 + matrixOrigin.x, matrixOrigin.y ], `TRIGGER_LOOP`);
    models.push(h);
    paths = paths.concat(h.paths);
    kicadData += h.kicadData;

    const matrix_conn = [ "COL0", "COL1", "COL2", "COL3", "COL4", "COL5", "COL6", "COL7",
                          "COL8", "COL9", "COL10", "COL11", "COL12", "COL13", "COL14", "COL15",
                          "ROW0", "ROW1", "ROW2", "ROW3", "ROW4", "ROW5" ];
    var conn = new kicad.connector22("X1", matrixConnectorOrigin.x, matrixConnectorOrigin.y, 0, false, matrix_conn);
    models.push(conn);
    kicadData += conn.kicadData;
  }

  function matrixColumnConnectionsLower() {
    for (var i = 0; i < 16; i++) {
      for (var j = 0; j < 5; j++) {
        t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
        spool.windTrace(t, kicad.getSpool(`H${i}_${j}.C`), 0);
        spool.windTrace(t, kicad.getSpool(`H${i}_${j + 1}.C`), 0);
        paths = paths.concat(t.paths);
        kicadData += kicad.trace2kicadTrace(t, "B.Cu");
      }
    }

    b = [];
 
    for (var i = 0; i < 5; i++)
      b.push([ [`X1.P${i + 1}.C`, 0], [`H${i}_5.C`, 0] ]);

    i = 5;
      b.push([ [`X1.P${i + 1}.C`, 0], [`X1.P${i + 2}.T`, 0], [`H${i}_5.C`, 0] ]);

    for (var i = 6; i < 11; i++)
      b.push([ [`X1.P${i + 1}.C`, 0], [`X1.P${i + 2}.T`, 0], [`H${i - 1}_5.T`, 1], [`H${i}_5.C`, 0] ]);

    kicad.getSpool('X1.P17.T').r = 1.7 / 2 + .15 * 11;
    kicad.getSpool('X1.P17.T').u = true;
    kicad.getSpool(`X1.P17.T`).t = false;

    for (var i = 11; i < 15; i++)
      b.push([ [`X1.P${i + 1}.C`, 0], [`X1.P${i + 2}.T`, 0], [`X1.P17.T`, 0], [`H${i - 1}_5.T`, 1], [`H${i}_5.C`, 0] ]);

    i = 15;
      b.push([ [`X1.P${i + 1}.C`, 0],                        [`X1.P17.T`, 0], [`H${i - 1}_5.T`, 1], [`H${i}_5.C`, 0] ]);

    bus(b, "B.Cu");
  }

  function matrixColumnConnectionsUpper() {
    b = [];

    i = 0;
      b.push([ [`X1.P${i + 1}.C`, 0], [`H${i}_1.T`, 1], [`H${i}_0.C`, 0] ]);

    i = 1;
      kicad.getSpool(`H${i}_5.T`).r = 2;
      kicad.getSpool(`H${i}_1.T`).r = 2;
      b.push([ [`X1.P${i + 1}.C`, 0], [`H${i}_5.T`, 0], [`H${i}_1.T`, 0], [`H${i}_0.C`, 0] ]);

    i = 2;
      kicad.getSpool(`H${i}_1.T`).r = 2;
      b.push([ [`X1.P${i + 1}.C`, 0], [`H${i}_1.T`, 0], [`H${i}_0.C`, 0] ]);

    for (var i = 3; i < 5; i++) {
      kicad.getSpool(`H${i - 1}_5.T`).r = 2;
      kicad.getSpool(`H${i}_1.T`).r = 2;
      b.push([ [`X1.P${i + 1}.C`, 0], [`H${i - 1}_5.T`, 1], [`H${i}_1.T`, 0], [`H${i}_0.C`, 0] ]);
    }

    for (var i = 5; i < 11; i++) {
      kicad.getSpool(`H${i - 1}_5.T`).r = 2;
      kicad.getSpool(`H${i}_1.T`).r = 2;
      b.push([ [`X1.P${i + 1}.C`, 0], [`X1.P${i + 2}.T`, 0], [`H${i - 1}_5.T`, 1], [`H${i}_1.T`, 0], [`H${i}_0.C`, 0] ]);
    }

    kicad.getSpool('X1.P17.T').r = 1.7 / 2 + .15 * 11;
    kicad.getSpool('X1.P17.T').u = true;
    kicad.getSpool(`X1.P17.T`).t = false;
    
    for (var i = 11; i < 15; i++) {
      kicad.getSpool(`H${i - 1}_5.T`).r = 2;
      kicad.getSpool(`H${i}_1.T`).r = 2;
      b.push([ [`X1.P${i + 1}.C`, 0], [`X1.P${i + 2}.T`, 0], [`X1.P17.T`, 0], [`H${i - 1}_5.T`, 1], [`H${i}_1.T`, 0], [`H${i}_0.C`, 0] ]);
    }

    i=15
      kicad.getSpool(`H${i - 1}_5.T`).r = 2;
      kicad.getSpool(`H${i}_1.T`).r = 2;
      b.push([ [`X1.P${i + 1}.C`, 0], [`X1.P${i + 2}.T`, 0], /*[`X1.P17.T`, 0],*/ [`H${i - 1}_5.T`, 1], [`H${i}_1.T`, 0], [`H${i}_0.C`, 0] ]);

    bus(b, "B.Cu");
  }

  function matrixLeds() {
    for (var i = 0; i < 16; i++) {
      for (var j = 0; j < 6; j++) {
        const d = 2 + 500e-3;
        const x = i * 8 + matrixOrigin.x + d * Math.sin(Math.PI / 4);
        const y = j * 8 + matrixOrigin.y - d * Math.sin(Math.PI / 4);
        var led = new kicad.package0402(`D${i}_${j}`, x, y, 135, false, [ `COL${i}`, `ROW${5 - j}` ]);
        models.push(led);
        kicadData += led.kicadData;

        var t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
        spool.windTrace(t, kicad.getSpool(`D${i}_${j}.P1.C`), 0);
        spool.windTrace(t, kicad.getSpool(`H${i}_${j}.C`), 0);
        paths = paths.concat(t.paths);
        kicadData += kicad.trace2kicadTrace(t, "F.Cu");
      }
    }

    b = [];
    for (var j = 0; j < 6; j++)
      b.push([ [`D0_${j}.P2.C`, 0], [`H1_${j}.T`, 1], [`D1_${j}.P2.C`, 0] ]);
    bus(b, "F.Cu");

    for (var i = 1; i < 15; i++) {
      b = [];
      for (var j = 0; j < 6; j++) {
        kicad.getSpool(`H${i}_${j}.T`).r = 2;
        b.push([ [`D${i + 1}_${j}.P2.C`, 0], [`H${i + 1}_${j}.T`, 0], [`H${i}_${j}.T`, 0] ]);
      }
      bus(b, "F.Cu");
    }

    for (var j = 0; j < 6; j++)
    kicad.getSpool(`H15_${5 - j}.T`).r = 2;

    kicad.getSpool(`X1.P22.T`).r = 1.7 / 2 + 0.15 * 11; 
    kicad.getSpool(`X1.P22.T`).u = true;
    kicad.getSpool(`X1.P22.T`).t = false;

    bus([
      [ [`X1.P17.C`, 0], [`X1.P18.T`, 0], [`X1.P22.T`, 0], [`H15_5.T`, 1], [`D15_5.P2.C`, 0] ],
      [ [`X1.P18.C`, 0], [`X1.P19.T`, 0], [`X1.P22.T`, 0], [`H15_5.T`, 1], [`D15_5.P2.C.SW`, 1], [`D15_4.P2.C`, 0] ],
      [ [`X1.P19.C`, 0], [`X1.P20.T`, 0], [`X1.P22.T`, 0], [`H15_5.T`, 1], [`D15_5.P2.C.SW`, 1], [`D15_4.P2.C.SW`, 1], [`D15_3.P2.C`, 0] ],
      [ [`X1.P20.C`, 0], [`X1.P21.T`, 0], [`X1.P22.T`, 0], [`H15_5.T`, 1], [`D15_5.P2.C.SW`, 1], [`D15_3.P2.C.SW`, 1], [`D15_2.P2.C`, 0] ],
      [ [`X1.P21.C`, 0], [`X1.P22.T`, 0],                  [`H15_5.T`, 1], [`D15_5.P2.C.SW`, 1], [`D15_2.P2.C.SW`, 1], [`D15_1.P2.C`, 0] ],
      [ [`X1.P22.C`, 0],                                   [`H15_5.T`, 1], [`D15_5.P2.C.SW`, 1], [`D15_1.P2.C.SW`, 1], [`D15_0.P2.C`, 0] ],
    ], "F.Cu");
  }

  function matrixLower() {
    matrix();
    matrixColumnConnectionsLower();
  }

  function matrixUpper() {
    matrix();
    matrixLeds();
    matrixColumnConnectionsUpper();
  }

  nets();

//matrixLower();
  matrixUpper();

  components();
  top();
  bottom();

  function boardOutline() {
    this.models = [
      makerjs.model.move(new makerjs.models.Rectangle(44.5 * 3 + 20, 96), [-20, -64]),
      makerjs.model.move(new makerjs.models.Oval(40,40), [70, -12])
    ];
    this.paths = [
    ];
  }

  var bo = new boardOutline();
  models.push(bo);

  kicadData += kicad.model2kicadBoardOutline(bo);

  function gndPlane() {
    this.models = [];
    this.models.push(makerjs.model.move(new makerjs.models.Rectangle(20 * 2.54, 16 * 2.54), [-6 * 2.54, -5 * 2.54]));
  }

  var gp = new gndPlane();
  models.push(gp);

  kicadData += kicad.model2kicadFill(gp, "F.Cu", "GND");
  kicadData += kicad.model2kicadFill(gp, "B.Cu", "GND");
 
  this.kicadData = kicadData;
  this.paths = paths;
  this.models = models;
}

if (typeof document === 'undefined') {
  stuff = new board();
  console.log(kicad.dumpHeader());
  console.log(kicad.dumpNets());
  console.log(stuff.kicadData);
  console.log(")");
} else {
  var stuff = {
    models: {
      sb: new board(),
    }
  }
  var svg = makerjs.exporter.toSVG(stuff, { useSvgPathOnly: false });
  document.write(svg);
}
