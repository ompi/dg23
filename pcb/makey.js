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
    minTraceSpacing: 127e-3, //200e-3,
    minTraceWidth: 127e-3, //200e-3,
    minTraceToBoardEdgre: 381e-3, //250e-3,

    minHoleDiameter: 254e-3, //300e-3,
    minPadDiameter: 127e-3 * 2, //300e-3,
  });

  var rules = kicad.getRules();

  [ "VBUS", "D-", "D+", "CC1" ].forEach((n) => {
    kicad.addNet(`${n}`);
  });

[ "LRCLK", "SCLK", "SDMOSI", "MCLK", "REF", "RST", "CFGMODE", "CIN", "EXC", "A", "Y", "CLEANOUT", "RAWOUT",
                                                      "NREG", "PREG", "HPR", "HPL", "VDD", "HPLD", "HPRD", "GNDD",
                                                      "VSS", "C1N", "GND", "C1P", "SCL", "SDA" ].forEach((n) => {
    kicad.addNet(`${n}`);
  });

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

    const nets = [
      "VCC", "GND",

      "#RESET", "RESET", "#EN", "CLK", "STOP", "BUTTON",
      "TRIGGER_STOP", "TRIGGER_LOOP",
      "LOOPQ", "STOPQ",
      "SRQ", "#SRQ",

      "CNT0", "CNT1", "CNT2", "CNT3",

      "COL0", "COL1", "COL2", "COL3", "COL4", "COL5", "COL6", "COL7",
      "COL8", "COL9", "COL10", "COL11", "COL12", "COL13", "COL14", "COL15",

      "1CLK", "1CLR", "1QA(LSB)", "1QB", "1QC", "1QD(MSB)",
      "2QD(MSB)", "2QC", "2QB", "2QA(LSB)", "2CLR", "2CLK",

      "1A", "1B", "1Y", "2A", "2B", "2Y",
      "3Y", "3A", "3B", "4Y", "4A", "4B",

      "#1RD", "1D", "1CP", "#1SD", "1Q", "#1Q",
      "#2Q", "2Q", "#2SD", "2CP", "2D", "#2RD",

"1A", "1Y", "2A", "2Y", "3A", "3Y",
                 "4Y", "4A", "5Y", "5A", "6Y", "6A"	
    ];

    nets.forEach((n) => {
      kicad.addNet(n);
    });

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

    // COLS
    for (var i = 0; i < 16; i++) {
      var v = new kicad.via(`VCOL${i}`, [i * 2.54 - 3.5 * 2.54, -4 * 2.54], `COL${i}`);
      paths = paths.concat(v.paths);
      kicadData += v.kicadData;
    }

    // CNTS
    for (var i = 0; i < 3; i++) {
      var v = new kicad.via(`VCNT${i}`, [i * 2.54 - 3.5 * 2.54, -0.5 * 2.54], `CNT${i}`);
      paths = paths.concat(v.paths);
      kicadData += v.kicadData;
    }
    var v = new kicad.via("VCNT3", [0.5 * 2.54, -0.5 * 2.54], "CNT3");
    paths = paths.concat(v.paths);
    kicadData += v.kicadData;

    // #EN
    var v = new kicad.via("VEN", [-0.5 * 2.54, -0.5 * 2.54], "#EN");
    paths = paths.concat(v.paths);
    kicadData += v.kicadData;
  }

  function top() {
    // COLS

    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool("U1.P7.C"), 0);
    spool.windTrace(t, kicad.getSpool("VCOL7.C"), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    // CNTS0
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('VCNT0.C'), 0);
    spool.windTrace(t, kicad.getSpool('VCNT1.T'), 0);
    kicad.getSpool("VCNT3.T").r += (rules.minTraceWidth + rules.minTraceSpacing) * 3;
    spool.windTrace(t, kicad.getSpool('VCNT3.T'), 0);
    spool.windTrace(t, kicad.getSpool('U1.P8.T'), 1);
    spool.windTrace(t, kicad.getSpool('U2.P1.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    // CNTS1
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('VCNT1.C'), 0);
    spool.windTrace(t, kicad.getSpool('VCNT2.T'), 0);
    kicad.getSpool("VCNT3.T").r -= (rules.minTraceWidth + rules.minTraceSpacing) * 2;
    spool.windTrace(t, kicad.getSpool('VCNT3.T'), 0);
    spool.windTrace(t, kicad.getSpool('U2.P1.T'), 1);
    spool.windTrace(t, kicad.getSpool('U2.P2.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    // CNTS2
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('VCNT2.C'), 0);
    spool.windTrace(t, kicad.getSpool('VEN.T'), 0);
    kicad.getSpool("VCNT3.T").r -= (rules.minTraceWidth + rules.minTraceSpacing) * 2;
    spool.windTrace(t, kicad.getSpool('VCNT3.T'), 0);
    spool.windTrace(t, kicad.getSpool('U2.P1.T'), 1);
    spool.windTrace(t, kicad.getSpool('U2.P2.T'), 1);
    spool.windTrace(t, kicad.getSpool('U2.P3.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    // #EN
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('VEN.C'), 0);
    kicad.getSpool("VCNT3.T").r -= (rules.minTraceWidth + rules.minTraceSpacing) * 2;
    spool.windTrace(t, kicad.getSpool('VCNT3.T'), 0);
    spool.windTrace(t, kicad.getSpool('U2.P1.T'), 1);
    spool.windTrace(t, kicad.getSpool('U2.P3.T'), 1);
    spool.windTrace(t, kicad.getSpool('U2.P4.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    // CNTS3
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('VCNT3.C'), 0);
    spool.windTrace(t, kicad.getSpool('U2.P1.T'), 1);
    spool.windTrace(t, kicad.getSpool('U2.P5.T'), 1);
    spool.windTrace(t, kicad.getSpool('U2.P6.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

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
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U5.P3.C'), 0);
    spool.windTrace(t, kicad.getSpool('U5.P4.T'), 1);
    spool.windTrace(t, kicad.getSpool('R2.P2.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    // TRIGGER_STOP
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
  }

  function bottom() {
    // COLS

    for (var i = 0; i < 7; i++) {
      t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
      spool.windTrace(t, kicad.getSpool(`U1.P${15 - i}.C`), 0);
      spool.windTrace(t, kicad.getSpool(`VCOL${i}.C`), 0);
      paths = paths.concat(t.paths);
      kicadData += kicad.trace2kicadTrace(t, "B.Cu");
    }

    for (var i = 0; i < 7; i++) {
      t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
      spool.windTrace(t, kicad.getSpool(`U2.P${15 - i}.C`), 0);
      spool.windTrace(t, kicad.getSpool(`U2.P${i + 1}.T`), 0);
      spool.windTrace(t, kicad.getSpool(`VCOL${i + 8}.C`), 0);
      paths = paths.concat(t.paths);
      kicadData += kicad.trace2kicadTrace(t, "B.Cu");
    }

    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool("U2.P7.C"), 0);
    spool.windTrace(t, kicad.getSpool("VCOL15.C"), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "B.Cu");

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
    spool.windTrace(t, kicad.getSpool('C4.P1.C'), 1);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "B.Cu");

    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U6.P14.C'), 1);
    spool.windTrace(t, kicad.getSpool('U5.P1.C'), 1);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "B.Cu");
  }

  components();
  top();
  bottom();

/*
  var v = new kicad.via("VMCLK", [3, -1.7], "MCLK");
  paths = paths.concat(v.paths);
  kicadData += v.kicadData;

  var v = new kicad.via("VSDMOSI", [1.468, -3.604], "SDMOSI");
  paths = paths.concat(v.paths);
  kicadData += v.kicadData;

  var v = new kicad.via("VLRCLK", [3.546, -3.08], "LRCLK");
  paths = paths.concat(v.paths);
  kicadData += v.kicadData;

  var v = new kicad.via("VSDA", [2.42, -3.94], "SDA");
  paths = paths.concat(v.paths);
  kicadData += v.kicadData;*/

  function boardOutline() {
    this.models = [
      makerjs.model.move(new makerjs.models.Rectangle(20 * 2.54, 16 * 2.54), [-6 * 2.54, -5 * 2.54])
    ];
    this.paths = [
/*      new makerjs.paths.Line([-w / 2, top], [-w / 2, y]),
      new makerjs.paths.Line([-w / 2, y], [w / 2, y]),
      new makerjs.paths.Line([w / 2, y], [w / 2, top]),
      new makerjs.paths.Line([w / 2, top], [-w / 2, top]),*/
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
