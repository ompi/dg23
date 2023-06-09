var makerjs = require('makerjs');

var font;

if (typeof document  === 'undefined') {
  var geom = require('./geometry.js').geom;
  var spool = require('./spool.js').spool;
  var kicad = require('./kicad.js').kicad;
  var opentype = require('opentype.js');

  font = opentype.loadSync('./Helvetica-Bold.otf');
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

  function power(traces, layer) {
    traces.forEach((trace) => {
      var t = { traceWidth: vccWidth, minTraceSpacing: rules.minTraceSpacing };
      trace.forEach((s) => {
        spool.windTrace(t, kicad.getSpool(s[0]), s[1]);
      });
      paths = paths.concat(t.paths);
      kicadData += kicad.trace2kicadTrace(t, layer);
    });
  }

  function speaker(traces, layer) {
    traces.forEach((trace) => {
      var t = { traceWidth: speakerWidth, minTraceSpacing: rules.minTraceSpacing };
      trace.forEach((s) => {
        spool.windTrace(t, kicad.getSpool(s[0]), s[1]);
      });
      paths = paths.concat(t.paths);
      kicadData += kicad.trace2kicadTrace(t, layer);
    });
  }

  function coil(traces, layer) {
    traces.forEach((trace) => {
      var t = { traceWidth: coilWidth, minTraceSpacing: rules.minTraceSpacing };
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
  const speakerWidth = 0.6;
  const coilWidth = 0.5;

  function nets() {
    const ns = [
      "VCC", "GND",

      "#RESET", "RESET", "#EN", "CLK", "CLK_DIV16", "STOP", "BUTTON",
      "TRIGGER_STOP", "TRIGGER_LOOP",
      "LOOPQ", "STOPQ",
      "SRQ", "#SRQ",

      "CLKX", "CLKY", "CLKR",

      "CNT0", "CNT1", "CNT2", "CNT3",

      "COL0", "COL1", "COL2", "COL3", "COL4", "COL5", "COL6", "COL7",
      "COL8", "COL9", "COL10", "COL11", "COL12", "COL13", "COL14", "COL15",

      "ROW0", "ROW1", "ROW2", "ROW3", "ROW4", "ROW5", "ROW6", "ROW7", "ROW8",

      "RAMPOSC",
      "RAMP0", "RAMP1", "RAMP2", "RAMP3",

      "OUT",
      "OUT_P",
      "OUT_N", "AMPN_N",

      "VBIAS",

      "1CLK", "1CLR", "1QA(LSB)", "1QB", "1QC", "1QD(MSB)",
      "2QD(MSB)", "2QC", "2QB", "2QA(LSB)", "2CLR", "2CLK",

      "1A", "1B", "1Y", "2A", "2B", "2Y",
      "3Y", "3A", "3B", "4Y", "4A", "4B",

      "#1RD", "1D", "1CP", "#1SD", "1Q", "#1Q",
      "#2Q", "2Q", "#2SD", "2CP", "2D", "#2RD",

      "1A", "1Y", "2A", "2Y", "3A", "3Y",
      "4Y", "4A", "5Y", "5A", "6Y", "6A",

      "1OUT", "2OUT", "VCC", "2IN-", "2IN+", "1IN-", "1IN+",
      "3IN-", "3IN+", "4IN-", "4IN+", "GND", "4OUT", "3OUT",

      "OSC0_N", "OSC0_O", "OSC0_P", "OSC0_R",
      "OSC1_N", "OSC1_O", "OSC1_P", "OSC1_R",
      "OSC2_N", "OSC2_O", "OSC2_P", "OSC2_R",
      "OSC3_N", "OSC3_O", "OSC3_P", "OSC3_R",
      "OSC4_N", "OSC4_O", "OSC4_P", "OSC4_R",
      "OSC5_N", "OSC5_O", "OSC5_P", "OSC5_R",

      ""
    ];

    ns.forEach((n) => {
      kicad.addNet(n);
    });
  }

  function opamp(x, y, base, osc_base, inputs, outputs, en, pinout) {

    const u1 = `U${base + 1}`;
    var chip = new kicad.packageDip14(u1, x, y, 90, false, pinout);
    models.push(chip);
    kicadData += chip.kicadData;

    const c1 = `C${base + 1}`;
    var cap = new kicad.packageThd2P(c1, x - 1 * 2.54, y - 3 * 2.54, 270, false, ["VCC", "GND"]);
    models.push(cap);
    kicadData += cap.kicadData;

    function osc(x, y, base, osc, m, n, p, en) {
      const a = m == -1 ? 180 : 0;

      const c1 = `C${base + 1}`;
      var cap = new kicad.packageThd2P(c1, x, y, a, false, ["GND", `OSC${osc}_N`]);
      models.push(cap);
      kicadData += cap.kicadData;

      const r1 = `R${base + 1}`;
      var res = new kicad.packageThd2P(r1, x, y - m * 2.54, a, false, [`OSC${osc}_R`, `OSC${osc}_N`]);
      models.push(res);
      kicadData += res.kicadData;

      const r2 = `R${base + 2}`;
      var res = new kicad.packageThd2P(r2, x, y - m * 2 * 2.54, a, false, [outputs[osc%4], `OSC${osc}_P`]);
      models.push(res);
      kicadData += res.kicadData;

      const r3 = `R${base + 3}`;
      var res = new kicad.packageThd2P(r3, x, y - m * 3 * 2.54, a, false, [en, `OSC${osc}_P`]);
      models.push(res);
      kicadData += res.kicadData;

      bus([
        [ [n, 0], [`${c1}.P2.C`, 0] ],
      ], "F.Cu");

      bus([
        [ [`${c1}.P2.C`, 0], [`${r1}.P2.C`, 0] ],
        [ [p, 0], [`${c1}.P2.T`, 1], [`${r1}.P2.T`, 1], [`${r2}.P2.C`, 0] ],
        [ [`${r2}.P2.C`, 0], [`${r3}.P2.C`, 0] ],
      ], "B.Cu");
    }

    en[0] && osc(x + 0.5 * 2.54, y - 2.5 * 2.54, base + 10, osc_base + 0, 1, `${u1}.P4.C`, `${u1}.P5.C`, inputs[0]);
    en[1] && osc(x + 2.5 * 2.54, y - 2.5 * 2.54, base + 20, osc_base + 1, 1, `${u1}.P6.C`, `${u1}.P7.C`, inputs[1]);
    en[2] && osc(x + 2.5 * 2.54, y + 2.5 * 2.54, base + 30, osc_base + 2, -1, `${u1}.P8.C`, `${u1}.P9.C`, inputs[2]);
    en[3] && osc(x + 0.5 * 2.54, y + 2.5 * 2.54, base + 40, osc_base + 3, -1, `${u1}.P10.C`, `${u1}.P11.C`, inputs[3]);

    power([[ [`${u1}.P3.C`, 0], [`${c1}.P1.C`, 0] ]], "B.Cu");
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
                     "3IN-", "3IN+", "4IN-", "4IN+", "GND", "4OUT", "3OUT" ] // opamp

    const dip14 = [ "1", "2", "3", "4", "5", "6", "7",
                    "8", "9", "10", "11", "12", "13", "14" ]

    const dip16 = [ "1", "2", "3", "4", "5", "6", "7", "8",
                    "9", "10", "11", "12", "13", "14", "15", "16" ]

    //            "1OUT",   "2OUT",   "VCC",    "2IN-",   "2IN+",   "1IN-",   "1IN+",
    const op1 = [ "CLK",    "OSC0_O", "VCC",    "OSC0_N", "OSC0_P", "OSC1_N", "OSC1_P",
                  "OSC2_N", "OSC2_P", "OSC3_N", "OSC3_P", "GND",    "OSC3_O", "OSC2_O"  ] // opamp

    const op2 = [ "OSC5_O", "OSC4_O", "VCC",    "OSC4_N", "OSC4_P", "OSC5_N", "OSC5_P",
                  "AMPN_N", "VBIAS",  "OUT",    "VBIAS",  "GND",    "OUT_P",  "OUT_N"   ] // opamp
    //            "3IN-",   "3IN+",   "4IN-",   "4IN+",   "GND",    "4OUT",   "3OUT"

    opamp(14.5 * 2.54, 5 * 2.54, 100, 0, [ "ROW0", "#EN", "ROW2", "ROW1" ], [ "OSC0_O", "CLK", "OSC2_O", "OSC3_O" ], [ 1, 1, 1, 1 ], op1);
    opamp(21.5 * 2.54, 5 * 2.54, 200, 4, [ "ROW3", "ROW4", "", "" ], [ "OSC4_O", "OSC5_O", "", "" ], [ 1, 1, 0, 0 ], op2);

{
    base = 100;
    const u1 = `U${base + 1}`;
    const c1 = `C${base + 1}`;
}

{
    base = 200;
    const u1 = `U${base + 1}`;
    const c1 = `C${base + 1}`;
    bus([
      [ [`${u1}.P2.C`, 0], [`${c1}.P2.T`, 0], [`R${base + 12}.P1.C`, 0] ],
      [ [`${u1}.P1.C`, 0], [`${c1}.P2.T`, 0], [`R${base + 12}.P1.T`, 0], [`R${base + 12}.P2.T`, 0], [`R${base + 22}.P1.C`, 0] ],
    ], "F.Cu");
}

//                                         s1     s1
    const u1 = [ "CNT0", "CNT1", "CNT2", "#EN", "CNT3", "VCC", "COL7", "GND",
                 "COL6", "COL5", "COL4", "COL3", "COL2", "COL1", "COL0", "VCC" ] // decoder
    var chip = new kicad.packageDip16("U1", 0, 2.54, 90, false, u1);
    models.push(chip);
    kicadData += chip.kicadData;

    var cap = new kicad.packageThd2P("C1", -4.5 * 2.54, 2 * 2.54, 270, false, ["VCC", "GND"]);
    models.push(cap);
    kicadData += cap.kicadData;

//                                         s1     s1
    const u2 = [ "CNT0", "CNT1", "CNT2", "#EN", "GND", "CNT3", "COL15", "GND",
                 "COL14", "COL13", "COL12", "COL11", "COL10", "COL9", "COL8", "VCC" ] // decoder
    var chip = new kicad.packageDip16("U2", 9 * 2.54, 2.54, 90, false, u2);
    models.push(chip);
    kicadData += chip.kicadData;

    var cap = new kicad.packageThd2P("C2", 4.5 * 2.54, 2 * 2.54, 270, false, ["VCC", "GND"]);
    models.push(cap);
    kicadData += cap.kicadData;

//               "1CLK",      "1CLR", "1QA(LSB)", "1QB",      "1QC",   "1QD(MSB)", "GND"
    const u3 = [ "CLK_DIV16", "RESET", "CNT0",    "CNT1",     "CNT2",  "CNT3",     "GND",
                 "CLK_DIV16", "",      "",        "",         "RESET", "CLK",      "VCC" ] // counter
//               "2QD(MSB)",  "2QC",   "2QB",     "2QA(LSB)", "2CLR",  "2CLK",     "VCC"
    var chip = new kicad.packageDip14("U3", -0.5 * 2.54, 5 * 2.54, 90, false, u3);
    models.push(chip);
    kicadData += chip.kicadData;

    var cap = new kicad.packageThd2P("C3", -4.5 * 2.54, 6 * 2.54, 270, false, ["VCC", "GND"]);
    models.push(cap);
    kicadData += cap.kicadData;

//                  s1       s1              s4        s4
    const u4 = [ "#RESET", "#SRQ", "SRQ", "BUTTON", "LOOPQ", "RESET", "GND",
                 "#EN", "BUTTON", "SRQ", "#SRQ", "SRQ", "STOP", "VCC" ] // NAND
//                          s3     s3             s2     s2
    var chip = new kicad.packageDip14("U4", -0.5 * 2.54, 9 * 2.54, 90, false, u4);
    models.push(chip);
    kicadData += chip.kicadData;

    var cap = new kicad.packageThd2P("C4", -4.5 * 2.54, 10 * 2.54, 270, false, ["VCC", "GND"]);
    models.push(cap);
    kicadData += cap.kicadData;

//               "#1RD", "1D",  "1CP",          "#1SD",   "1Q",    "#1Q", "GND",
    const u5 = [ "VCC",  "GND", "TRIGGER_LOOP", "#RESET", "LOOPQ", "",    "GND",
                 "",    "STOP", "#RESET", "TRIGGER_STOP", "GND", "VCC",  "VCC" ] // D flip-flop
//               "#2Q", "2Q",   "#2SD",   "2CP",          "2D",  "#2RD", "VCC"

    var chip = new kicad.packageDip14("U5", 7.5 * 2.54, 9 * 2.54, 90, false, u5);
    models.push(chip);
    kicadData += chip.kicadData;

    var cap = new kicad.packageThd2P("C5", 3.5 * 2.54, 10 * 2.54, 270, false, ["VCC", "GND"]);
    models.push(cap);
    kicadData += cap.kicadData;

    var res = new kicad.packageThd2P("R1", 11.5 * 2.54, 10 * 2.54, 270, false, ["VCC", "TRIGGER_STOP"]);
    models.push(res);
    kicadData += res.kicadData;

    var res = new kicad.packageThd2P("R2", 12.5 * 2.54, 10 * 2.54, 270, false, ["VCC", "TRIGGER_LOOP"]);
    models.push(res);
    kicadData += res.kicadData;

    var res = new kicad.packageThd2P("R3", -4.5 * 2.54, 8 * 2.54, 90, false, ["VCC", "BUTTON"]);
    models.push(res);
    kicadData += res.kicadData;

    var res = new kicad.packageThd2P("R4", 18.5 * 2.54, 0 * 2.54, 270, false, ["VCC", "OSC1_P"]);
    models.push(res);
    kicadData += res.kicadData;

//               "1A",  "1Y", "2A",  "2Y", "3A" , "3Y", "GND",
    const u6 = [ "GND", "",   "GND", "",   "GND", "",   "GND",
                 "",   "GND", "",   "GND", "#RESET", "RESET", "VCC" ] // NOT
//               "4Y", "4A",  "5Y", "5A",  "6Y",     "6A",    "VCC"
    var chip = new kicad.packageDip14("U6", 7.5 * 2.54, 5 * 2.54, 90, false, u6);
    models.push(chip);
    kicadData += chip.kicadData;

    var cap = new kicad.packageThd2P("C6", 3.5 * 2.54, 6 * 2.54, 270, false, ["VCC", "GND"]);
    models.push(cap);
    kicadData += cap.kicadData;

    // OSCx POTS
    for (var i = 0; i < 5; i++) {
      const px = 121;
      const py = 20;
      const vo = -15;
      const oscs = [ 'OSC0', 'OSC3', 'OSC2', 'OSC0', 'OSC0' ];
      var res = new kicad.potRk09(`R${i + 5}`, px, py + i * vo, 270, false, [ `${oscs[i]}_R`, `${oscs[i]}_R`, `${oscs[i]}_O`, "GND", "GND" ]);
      models.push(res);
      kicadData += res.kicadData;
    }

    var res = new kicad.potRk09('R11', -9 * 2.54, -2 * 2.54, 90, false, [ 'OSC1_R', 'OSC1_R', 'CLK', "GND", "GND" ]);
    models.push(res);
    kicadData += res.kicadData;

    var res = new kicad.potRk09('R21', -9 * 2.54, 4.5 * 2.54, 90, false, [ 'OUT', 'OUT_P', 'OUT_P', "GND", "GND" ]);
    models.push(res);
    kicadData += res.kicadData;

    // ROW PULLUPS
    var res = new kicad.packageSip10('R10', 12.5 * 2.54, -1.5 * 2.54, 0, false, 
      [ "ROW7", "ROW8", "ROW0", "ROW1", "ROW2", "ROW3", "ROW4", "ROW5", "ROW6", "VCC", ]);
    models.push(res);
    kicadData += res.kicadData;

    var res = new kicad.packageThd2P("R12", 12 * 2.54, 8.5 * 2.54, 0, false, ["OSC3_O", "OUT"]);
    models.push(res);
    kicadData += res.kicadData;

    var res = new kicad.packageThd2P("R13", 12 * 2.54, 7.5 * 2.54, 0, false, ["OSC2_O", "OUT"]);
    models.push(res);
    kicadData += res.kicadData;

    var res = new kicad.packageThd2P("R14", 13.5 * 2.54, 8 * 2.54, 90, false, ["OSC0_O", "OUT"]);
    models.push(res);
    kicadData += res.kicadData;

    var res = new kicad.packageThd2P("R15", 18.5 * 2.54, 10 * 2.54, 90, false, ["OSC5_O", "OUT"]);
    models.push(res);
    kicadData += res.kicadData;

    var res = new kicad.packageThd2P("R16", 19.5 * 2.54, 10 * 2.54, 90, false, ["OSC4_O", "OUT"]);
    models.push(res);
    kicadData += res.kicadData;

    var res = new kicad.packageThd2P("R17", 23.5 * 2.54, 8 * 2.54, 90, false, ["VBIAS", "VCC"]);
    models.push(res);
    kicadData += res.kicadData;

    var res = new kicad.packageThd2P("R18", 24.5 * 2.54, 8 * 2.54, 90, false, ["AMPN_N", "OUT_P"]);
    models.push(res);
    kicadData += res.kicadData;

    var res = new kicad.packageThd2P("R19", 19 * 2.54, 7.5 * 2.54, 0, false, ["OUT_N", "AMPN_N"]);
    models.push(res);
    kicadData += res.kicadData;

    var res = new kicad.packageThd2P("R20", 21 * 2.54, 7.5 * 2.54, 0, false, ["GND", "VBIAS"]);
    models.push(res);
    kicadData += res.kicadData;

    // CNTS
    for (var i = 0; i < 3; i++) {
      var v = new kicad.via(`VCNT${i}`, [i * 2.54 - 3.5 * 2.54, 1 * 2.54], `CNT${i}`);
      paths = paths.concat(v.paths);
      kicadData += v.kicadData;
    }
    var v = new kicad.via("VCNT3", [0.5 * 2.54, 1 * 2.54], "CNT3");
    paths = paths.concat(v.paths);
    kicadData += v.kicadData;

    // #EN
    var v = new kicad.via("VEN", [-0.5 * 2.54, 1 * 2.54], "#EN");
    paths = paths.concat(v.paths);
    kicadData += v.kicadData;

    // RESET
    var v = new kicad.via("VRESET", [3.5 * 2.54, 3.5 * 2.54], "RESET");
    models.push(v);
    kicadData += v.kicadData;

    // CLK
    var v = new kicad.via("VCLK", [-3 * 2.54, 3 * 2.54], "CLK");
    models.push(v);
    kicadData += v.kicadData;

    // COL15
    var v = new kicad.via("VCOL15", [13.25 * 2.54, -0.5 * 2.54], "COL15");
    models.push(v);
    kicadData += v.kicadData;

    // COL7
    var v = new kicad.via("VCOL7", [4.25 * 2.54, -0.5 * 2.54], "COL15");
    models.push(v);
    kicadData += v.kicadData;

    // XXX
    var v = new kicad.via("VX2", [27 * 2.54, 5 * 2.54], "GND");
    models.push(v);
    kicadData += v.kicadData;

    var v = new kicad.via("VX3", [27 * 2.54, 8 * 2.54], "GND");
    models.push(v);
    kicadData += v.kicadData;

    // CLK_DIV16
    var v = new kicad.via("VCLK_DIV16", [-3 * 2.54, 7 * 2.54], "CLK_DIV16");
    models.push(v);
    kicadData += v.kicadData;

    // VCC
    var v = new kicad.pinHole("VVCC1", [13.5 * 2.54, 5.5 * 2.54], "VCC");
    models.push(v);
    kicadData += v.kicadData;

    var v = new kicad.pinHole("VVCC2", [19 * 2.54, 5.5 * 2.54], "VCC");
    models.push(v);
    kicadData += v.kicadData;

    // COIL
    var v = new kicad.via("VCOIL1", [75, 16], "GND");
    models.push(v);
    kicadData += v.kicadData;

    var v = new kicad.via("VCOIL2", [105, 16], "GND");
    models.push(v);
    kicadData += v.kicadData;
  }

  function dothecoil() {
    var b = [ [] ];
    b[0].push(['VCOIL1.C', 0]);
    for (i = 0; i < 10; i++) {
      b[0].push(['VCOIL2.T', 0]);
      b[0].push(['VCOIL1.T', 0]);
    }
    b[0].push(['VX3.C', 0]);
    coil(b, "F.Cu");

    kicad.getSpool('VCOIL1.T').r = 0.3;
    kicad.getSpool('VCOIL2.T').r = 0.3;

    var b = [ [] ];
    b[0].push(['VCOIL1.C', 0]);
    for (i = 0; i < 10; i++) {
      b[0].push(['VCOIL2.T', 1]);
      b[0].push(['VCOIL1.T', 1]);
    }
    b[0].push(['VX2.C', 0]);
    coil(b, "B.Cu");
  }

  function top() {
    // COLS
    bus([
      [ ['VCOL7.C', 0], ['U1.P8.T', 0], ['U1.P7.C', 0] ],
      [ ['VCOL15.C', 0], ['U2.P8.T', 0], ['U2.P7.C', 0] ]
    ], "F.Cu");

    bus([
      [ ['VCNT0.C', 0], ['VCNT1.T', 0], ['U1.P8.T', 1], ['U2.P1.C', 0] ], // CNT0
      [ ['VCNT1.C', 0], ['VCNT2.T', 0], ['U2.P1.T', 1], ['U2.P2.C', 0] ], // CNT1
      [ ['VCNT2.C', 0], ['VEN.T', 0],   ['U2.P2.T', 1], ['U2.P3.C', 0] ], // CNT2
      [ ['VEN.C', 0],   ['VCNT3.T', 0], ['U2.P3.T', 1], ['U2.P4.C', 0] ], // #EN
      [ ['U2.P4.C', 0], ['U2.P5.T', 0], ['U2.P6.T', 0], ['U2.P7.T', 1], ['U2.P8.T', 1], ['R113.P2.T', 1], ['R123.P1.C', 0] ], // #EN
    ], "F.Cu");
    kicad.getSpool('U2.P5.T').r = 1.6 / 2;
    bus([
      [ ['VCNT3.C', 0], ['U2.P5.T', 1], ['U2.P6.C', 0] ]                  // CNT3
    ], "F.Cu");

    // LOOPQ
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U5.P5.C'), 0);
    spool.windTrace(t, kicad.getSpool('U5.P4.T'), 1);
    spool.windTrace(t, kicad.getSpool('U5.P1.T'), 1);
    spool.windTrace(t, kicad.getSpool('U4.P7.T'), 0);
    spool.windTrace(t, kicad.getSpool('U4.P6.T'), 0);
    spool.windTrace(t, kicad.getSpool('U4.P5.C'), 0);
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
    kicad.getSpool('R5.P1.T').r = 1.6 / 2 + 0.15 * 8;
    kicad.getSpool('R6.P1.T').r = 1.6 / 2 + 0.15 * 8;
    kicad.getSpool('R7.P1.T').r = 1.6 / 2 + 0.15 * 4;
    bus([ [ ['U5.P3.C', 0], ['U5.P4.T', 1], ['R1.P2.T', 0], ['R2.P2.C', 0], 
            ['R143.P2.T', 1], ['R16.P2.T', 1], ['R5.P1.T', 1], ['R6.P1.T', 1],
            ['R9.P3.T', 1], ['HTRIGGER_STOP.T', 0], ['HTRIGGER_LOOP.C', 0]
    ] ], "F.Cu");

    // TRIGGER_STOP
    kicad.getSpool('U5.P10.T').r = 1.6 / 2;
    bus([ [ ['U5.P11.C', 0], ['U5.P10.T', 0], ['R1.P2.C', 0],
            ['R143.P2.T', 1], ['R16.P2.T', 1], ['R5.P1.T', 1],
            ['HTRIGGER_STOP.C', 0]
    ] ], "F.Cu");

    // RESET
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    kicad.getSpool('U4.P7.T').r = 1.6 / 2;
    spool.windTrace(t, kicad.getSpool('U6.P13.C'), 0);
    spool.windTrace(t, kicad.getSpool('U6.P14.T'), 0);
    spool.windTrace(t, kicad.getSpool('U4.P7.T'), 1);
    spool.windTrace(t, kicad.getSpool('U4.P6.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    bus([
      [ ['U3.P2.C', 0], ['U3.P3.T', 1], ['U3.P7.T', 1], ['VRESET.C', 0] ]
    ], "F.Cu");

    // BUTTON
    bus([
      [ [ 'U4.P4.C', 0], ['U4.P3.T', 0], ['R3.P2.C', 0], ['R21.P3.T', 0], ['R11.P1.T', 0] ]
    ], "F.Cu");

    // CLK_DIV16
    bus([
      [ ['U3.P8.C', 0], ['U3.P9.T', 0], ['VCLK_DIV16.C', 0] ],
    ], "F.Cu");

    // CLK
    bus([
      [ ['VCLK.C', 0], /*['U3.P2.T', 0],*/ ['U6.P7.T', 0], ['U101.P1.C', 0] ], 
    ], "F.Cu");

    // OUT
    kicad.getSpool('R142.P2.T').r = 1.6/2 + 0.15 * 5;
    kicad.getSpool('R142.P2.T').u = true;
    kicad.getSpool('R142.P2.T').t = false;
    bus([
      [ ['R12.P2.C', 0], ['R13.P2.C', 0] ],   // OUT
      [ ['R12.P2.C', 0], ['R14.P2.C', 0] ],   // OUT
      [ ['U101.P14.C', 0], ['R13.P1.C', 0] ], // OSC2_O
      [ ['U101.P13.C', 0], ['U101.P14.T', 1], ['R13.P1.T', 1], ['R12.P1.C', 0] ], // OSC3_O
      [ ['R14.P2.C', 0], ['R142.P2.T', 1], ['R133.P1.T', 0], ['R15.P2.C', 0] ],
      [ ['R15.P2.C', 0], ['R16.P2.C', 0] ],
    ], "F.Cu");


    // OSC1_P pullup
    bus([
      [ ['R123.P2.C', 0], ['R4.P2.C', 0] ], 
    ], "F.Cu");

    kicad.getSpool('U2.P9.T').r = 1.6/2 + 0.15 * 5;
    kicad.getSpool('U2.P9.T').u = true;
    kicad.getSpool('U2.P9.T').t = false;

    // OPAMP1
    kicad.getSpool('R141.P2.T').r = 1.6/2;
    kicad.getSpool('R14.P1.T').r = 1.6/2 + 0.15 * 5;
    kicad.getSpool('R14.P1.T').u = true;
    kicad.getSpool('R14.P1.T').t = false;
    bus([
      [ ['U101.P2.C', 0], ['U2.P9.T', 1], ['C101.P2.T', 0], ['R112.P1.C', 0] ],
      [ ['U101.P1.C', 0], ['U2.P9.T', 1], ['C101.P2.T', 0], ['R112.P1.T', 0], ['R112.P2.T', 0], ['R122.P1.C', 0] ],
      [ ['U101.P13.C', 0], ['U101.P12.T', 1], ['R14.P1.T', 0], ['R141.P2.T', 1], ['R142.P1.C', 0] ],
      [ ['U101.P14.C', 0], ['U101.P13.T', 1], ['R14.P1.T', 0], ['R141.P2.T', 1], ['R142.P2.T', 1], ['R132.P2.T', 1], ['R132.P1.C', 0] ],
    ], "F.Cu");

    // ROWS
    bus([
      [ ['R10.P6.C', 0], ['R10.P7.T', 1], ['R213.P1.C', 0] ],                   // ROW3
      [ ['R10.P7.C', 0], ['R10.P8.T', 1], ['R213.P2.T', 0], ['R223.P1.C', 0] ], // ROW4
    ], "F.Cu");

    // POTS
    for (i = 0; i < 5; i++)
      bus([[ [`R${i + 5}.P1.C`, 0], [`R${i + 5}.P2.C`, 0] ]], "F.Cu");

    kicad.getSpool('R111.P2.T').r = 1.6/2;
    kicad.getSpool('C111.P2.T').r = 1.6/2 + 0.15 * 5;
    kicad.getSpool('C111.P2.T').u = true;
    kicad.getSpool('C111.P2.T').t = false;

    kicad.getSpool('R121.P2.T').r = 1.6/2;
    kicad.getSpool('C121.P2.T').r = 1.6/2 + 0.15 * 5;
    kicad.getSpool('C121.P2.T').u = true;
    kicad.getSpool('C121.P2.T').t = false;

    kicad.getSpool('R131.P2.T').r = 1.6/2;
    kicad.getSpool('R5.P1.T').r = 1.6/2 + 0.15 * 5;
    kicad.getSpool('R5.P1.T').u = true;
    kicad.getSpool('R5.P1.T').t = false;
    kicad.getSpool('R6.P1.T').r = 1.6/2 + 0.15 * 5;
    kicad.getSpool('R6.P1.T').u = true;
    kicad.getSpool('R6.P1.T').t = false;

    kicad.getSpool('VCOIL1.T').r = 8;
    kicad.getSpool('VCOIL1.T').u = true;
    kicad.getSpool('VCOIL1.T').t = false;

    kicad.getSpool('VCOIL2.T').r = 8;
    kicad.getSpool('VCOIL2.T').u = true;
    kicad.getSpool('VCOIL2.T').t = false;

    bus([
      [ ['R112.P1.C', 0], ['R111.P2.T', 1], ['C111.P2.T', 0], ['U101.P6.T', 1], ['U201.P7.T', 1], ['VCOIL1.T', 0], ['VCOIL2.T', 0], ['R5.P3.C', 0] ], // ROW0
      [ ['R111.P1.C', 0], ['R111.P2.T', 1], ['C111.P2.T', 0], ['U101.P6.T', 1], ['U201.P7.T', 1], ['VCOIL1.T', 0], ['VCOIL2.T', 0], ['R5.P3.T', 1], ['R5.P2.C', 0] ], // ROW0
    ], "F.Cu");

    kicad.getSpool('R10.P1.T').r = 1.6/2 + 0.15 * 5;
    kicad.getSpool('R10.P1.T').u = true;
    kicad.getSpool('R10.P1.T').t = false;
    kicad.getSpool('U2.P5.T').r = 1.6 / 2 + 0.15 * 2;
    bus([
      [ ['R122.P1.C', 0], ['R123.P1.T', 1],                   ['R10.P1.T', 0], ['U2.P6.T', 1], ['U2.P5.T', 1], ['R11.P3.C', 0] ], // LFO
      [ ['R121.P1.C', 0], ['R122.P1.T', 1], ['R123.P1.T', 1], ['R10.P1.T', 0], ['R11.P2.C', 0] ], // LFO
    ], "F.Cu");

    kicad.getSpool('R123.P1.T').r = 1.6/2;
    [ 
      ['R19.P2.T', 1.6/2 + speakerWidth * 2 + 0.15 * 7], 
      ['R17.P2.T', 1.6/2 + speakerWidth * 2 + 0.15 * 9], 
      ['R18.P2.T', 1.6/2 + speakerWidth * 2 + 0.15 * 9]
    ].forEach((s) => {
      kicad.getSpool(s[0]).r = s[1];
      kicad.getSpool(s[0]).u = true;
      kicad.getSpool(s[0]).t = false;
    });
    bus([
      [ ['R142.P1.C', 0], ['R131.P2.T', 0], ['R131.P1.T', 0],   ['R19.P2.T', 1], ['R17.P2.T', 1], ['R18.P2.T', 1],   ['R5.P1.T', 1], ['R6.P1.T', 1], ['R6.P2.T', 1], ['R6.P3.C', 1] ], // ROW1
      [ ['R141.P1.C', 0], ['R131.P2.T', 0], ['R131.P1.T', 0],   ['R19.P2.T', 1], ['R17.P2.T', 1], ['R18.P2.T', 1],   ['R5.P1.T', 1], ['R6.P1.T', 1], ['R6.P2.C', 1] ],                 // ROW1
    ], "F.Cu");
    [ 'R19.P2.T', 'R17.P2.T', 'R18.P2.T' ].forEach((s) => {
      kicad.getSpool(s).r = 1.6/2;
      delete kicad.getSpool(s).u;
      kicad.getSpool(s).t = true;
    });

    kicad.getSpool('R5.P1.T').r = 1.6/2 + 0.15 * 9;
    kicad.getSpool('R5.P1.T').u = false;
    kicad.getSpool('R6.P1.T').r = 1.6/2 + 0.15 * 9;
    kicad.getSpool('R6.P1.T').u = false;
    kicad.getSpool('R7.P1.T').r = 1.6/2 + 0.15 * 5;
    kicad.getSpool('R7.P1.T').u = true;
    kicad.getSpool('R7.P1.T').t = false;

    [ 
      ['R17.P2.T', 1.6/2 + speakerWidth * 2 + 0.15 * 13], 
      ['R18.P2.T', 1.6/2 + speakerWidth * 2 + 0.15 * 13]
    ].forEach((s) => {
      kicad.getSpool(s[0]).r = s[1];
      kicad.getSpool(s[0]).u = true;
      kicad.getSpool(s[0]).t = false;
    });
    bus([
      [ ['R132.P1.C', 0], ['R15.P1.T', 0], ['R16.P1.T', 0], ['R17.P2.T', 1], ['R18.P2.T', 1], ['R5.P1.T', 1], ['R6.P1.T', 1], ['R7.P1.T', 1], ['R7.P2.T', 1], ['R7.P3.C', 1] ], // ROW2
      [ ['R131.P1.C', 0], ['R17.P2.T', 1], ['R18.P2.T', 1], ['R5.P1.T', 1], ['R6.P1.T', 1], ['R7.P1.T', 1], ['R7.P2.C', 1] ], // ROW2
    ], "F.Cu");
    [ 'R17.P2.T', 'R18.P2.T' ].forEach((s) => {
      kicad.getSpool(s).r = 1.6/2;
      delete kicad.getSpool(s).u;
      kicad.getSpool(s).t = true;
    });

    kicad.getSpool('R221.P2.T').r = 1.6/2;
    kicad.getSpool('R9.P1.T').r = 1.6/2 + 0.15 * 5;
    kicad.getSpool('R9.P1.T').u = true;
    kicad.getSpool('R9.P1.T').t = false;
    bus([
      [ ['R222.P1.C', 0], ['R222.P2.T', 1], ['H15_5.T', 1], ['R9.P1.T', 0], ['R9.P2.T', 0], ['R9.P3.C', 0] ], // ROW4
      [ ['R221.P1.C', 0], ['R221.P2.T', 0], ['H15_5.T', 1], ['R9.P1.T', 0], ['R9.P2.C', 0] ], // ROW4
    ], "F.Cu");

    kicad.getSpool('R211.P2.T').r = 1.6/2;
    kicad.getSpool('R221.P2.T').r = 1.6/2;

    bus([
      [ ['R212.P1.C', 0], ['R211.P2.T', 1], ['R221.P2.T', 1], ['H15_5.T', 1], ['R8.P2.T', 0], ['R8.P3.C', 0] ], // ROW3
      [ ['R211.P1.C', 0], ['R211.P2.T', 1], ['R221.P2.T', 1], ['H15_5.T', 1], ['R8.P1.T', 0], ['R8.P2.C', 0] ], // ROW3
    ], "F.Cu");

    bus([
      [ ['U201.P9.C', 0], ['U201.P10.T', 1], ['U201.P11.C', 0] ], // VBIAS
      [ ['U201.P8.C', 0], ['U201.P9.T', 1], ['U201.P10.T', 1], ['U201.P12.T', 1], ['R19.P2.C', 0] ],                   // AMPN_N
      [ ['R18.P2.C', 0], ['R18.P1.T', 1], ['U201.P8.T', 1], ['U201.P10.T', 1], ['U201.P12.T', 1], ['U201.P13.C', 0] ], // OUT_P
    ], "F.Cu");

    bus([
      [ ['U201.P13.C', 0], ['VVCC2.T', 1], ['R21.P2.C', 0] ],
      [ ['U201.P10.C', 0], ['R17.P2.T', 1], ['R18.P2.T', 1], ['R18.P1.T', 1], ['U201.P8.T', 1],
        ['VVCC2.T', 1], ['U3.P3.T', 0], ['U3.P1.T', 0], ['R21.P1.C', 0] ], // OUT
    ], "F.Cu");

    speaker([
      [ ['U201.P13.C', 0], ['R19.P2.T', 1], ['R17.P2.T', 1], ['R18.P2.T', 1], ['VX2.C', 0] ], // OUT_P SPEAKER
      [ ['R19.P1.C', 0], ['R19.P2.T', 1], ['R17.P2.T', 1], ['R18.P2.T', 1], ['VX3.C', 0] ], // OUT_N SPEAKER
      [ ['U201.P14.C', 0], ['R19.P1.C', 0] ], // OUT_N SPEAKER
    ], "F.Cu");

    // VCC
    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U5.P13.C'), 0);
    spool.windTrace(t, kicad.getSpool('U5.P14.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "F.Cu");

    power([
      [ ['U6.P14.C', 0], ['C6.P1.C', 0], ['U3.P8.T', 1], ['U3.P13.T', 1], ['U3.P14.C', 1], ['C3.P1.C', 0] ],
      [ ['U5.P14.C', 0], ['C5.P1.C', 0], ['U4.P8.T', 1], ['U4.P13.T', 1], ['U4.P14.C', 1], ['C4.P1.C', 0] ],
      [ ['U6.P14.C', 0], ['U6.P13.T', 0], ['VVCC1.C', 0], ['VVCC2.C', 0] ],
    ], "F.Cu");

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
      [ ['X1.P8.C', 0],  ['VCOL7.C', 0] ],
      [ ['X1.P16.C', 0], ['VCOL15.C', 0] ]
    ], "B.Cu");

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
      spool.windTrace(t, kicad.getSpool(`X1.P${i + 9}.C`), 0);
      paths = paths.concat(t.paths);
      kicadData += kicad.trace2kicadTrace(t, "B.Cu");
    }

    // ROWS
    for (var i = 0; i < 6; i++) {
      t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
      spool.windTrace(t, kicad.getSpool(`R10.P${i + 3}.C`), 0);
      spool.windTrace(t, kicad.getSpool(`X1.P${i + 17}.C`), 0);
      paths = paths.concat(t.paths);
      kicadData += kicad.trace2kicadTrace(t, "B.Cu");
    }

    kicad.getSpool('R113.P2.T').r = 1.6 / 2;
    bus([
      [ ['R10.P3.C', 0], ['R113.P1.C', 0] ],                                     // ROW0
      [ ['R10.P4.C', 0], ['R113.P2.T', 1], ['R142.P1.T', 1], ['R143.P1.C', 0] ], // ROW1
      [ ['R10.P5.C', 0], ['R123.P1.T', 0], ['R132.P1.T', 1], ['R133.P1.C', 0] ], // ROW2
    ], "B.Cu");

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
    bus([
      [ [ 'U4.P4.C', 0 ], [ 'U4.P9.C', 0] ]
    ], "B.Cu");

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
    spool.windTrace(t, kicad.getSpool("U4.P5.T"), 0);
    spool.windTrace(t, kicad.getSpool("U3.P10.T"), 0);
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
    kicad.getSpool('U4.P13.T').r = 1.6 / 2;
    spool.windTrace(t, kicad.getSpool('U4.P13.T'), 1);
    spool.windTrace(t, kicad.getSpool('U4.P11.T'), 1);
    spool.windTrace(t, kicad.getSpool('U5.P11.T'), 1);
    spool.windTrace(t, kicad.getSpool('U5.P10.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "B.Cu");

    t = { traceWidth: rules.minTraceWidth, minTraceSpacing: rules.minTraceSpacing };
    spool.windTrace(t, kicad.getSpool('U5.P4.C'), 0);
    spool.windTrace(t, kicad.getSpool('U6.P12.C'), 0);
    paths = paths.concat(t.paths);
    kicadData += kicad.trace2kicadTrace(t, "B.Cu");

    // RESET
    bus([
      [ ['U3.P2.C', 0], ['U3.P12.C', 0] ],
      [ ['VRESET.C', 0], ['U6.P13.C', 0] ]
    ], "B.Cu");

    // CLK_DIV16
    bus([
      [ ['VCLK_DIV16.C', 0], ['U3.P1.C', 0] ],
    ], "B.Cu");

    // CLK
    bus([ [ ['U3.P13.C', 0], ['VCLK.C', 0] ] ], "B.Cu");

    // OSC0_O
    kicad.getSpool('U101.P12.T').r = 1.6/2;
    bus([ [ ['U101.P2.C', 0], ['U101.P12.T', 1], ['R14.P1.C', 0] ] ], "B.Cu");

    kicad.getSpool('R19.P2.T').r = 1.6/2;
    bus([
      [ ['U201.P1.C', 0], ['U201.P14.T', 1], ['R19.P1.T', 1], ['R15.P1.C', 0] ], // OSC5_O
    ], "B.Cu");
    kicad.getSpool('VVCC2.T').r = 1.6/2;
    kicad.getSpool('U201.P14.T').r = 1.6/2;
    bus([
      [ ['U201.P2.C', 0], ['VVCC2.T', 1], ['U201.P14.T', 0], ['R19.P2.T', 1], ['R16.P1.C', 0] ], // OSC4_O
    ], "B.Cu");

    bus([
      [ ['U201.P9.C', 0], ['R17.P1.C', 0] ],  // VBIAS
      [ ['U201.P11.C', 0], ['R20.P2.C', 0] ], // VBIAS
      [ ['U201.P8.C', 0], ['R18.P1.C', 0] ],  // AMP_N
      [ ['R16.P2.C', 0], ['R20.P2.T', 1], ['U201.P10.C', 0] ], // OUT
    ], "B.Cu");

    // VCC
    kicad.getSpool('C3.P2.T').r = 1.6/2;
    kicad.getSpool('C201.P2.T').r = 1.6/2;
    kicad.getSpool('U101.P12.T').r = 1.6/2;
    power([ [ ['C1.P1.C', 0], ['C3.P2.T', 1], ['C3.P1.C', 0], ['R3.P1.C', 0], ['R3.P2.T', 1], ['C4.P2.T', 1], ['C4.P1.C', 0] ] ], "B.Cu");
    power([
      [ ['U101.P3.C', 0], ['VVCC1.C', 0] ],
      [ ['U201.P3.C', 0], ['VVCC2.C', 0] ],
    ], "B.Cu");
    kicad.getSpool('U201.P10.T').r = 1.6/2;
    bus([
      [ ['VVCC1.C', 0], ['U101.P12.T', 0], ['R14.P2.T', 0], ['R2.P1.C', 0] ],
      [ ['R2.P1.C', 0], ['R1.P1.C', 0] ],
      [ ['VVCC2.C', 0], ['U201.P10.T', 0], ['R17.P1.T', 1], ['R17.P2.C', 0] ],
    ], "B.Cu");
    power([
      [ ['R10.P10.C', 0], ['R213.P1.T', 1], ['C201.P2.T', 1], ['C201.P1.C', 0] ],
    ], "B.Cu");
    bus([
      [ ['R4.P1.C', 0], ['C201.P1.C', 0] ],
    ], "B.Cu");

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

    i=15;
    kicad.getSpool(`H${i - 1}_5.T`).r = 2;
    kicad.getSpool(`H${i}_1.T`).r = 2;
    b.push([ [`X1.P${i + 1}.C`, 0], [`X1.P${i + 2}.T`, 0], [`H${i - 1}_5.T`, 1], [`H${i}_1.T`, 0], [`H${i}_0.C`, 0] ]);

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

matrixLower();
//  matrixUpper();

  components();
  dothecoil();
  top();
  bottom();

  function boardOutline() {
    this.models = [
      makerjs.model.move(new makerjs.models.Rectangle(44.5 * 3 + 20, 96), [-24, -64]),
//      makerjs.model.move(new makerjs.models.Oval(40,40), [70, -12]),
    ];
    this.paths = [
    ];
  }

  function logo() {
    var t = new makerjs.models.Text(font, 'Balatòn', 5);
    t = makerjs.model.mirror(t, 1, 0);

    w = 20;
    g = makerjs.model.move(new makerjs.models.Rectangle(w, 5.6), [1 - w, -1]);
    z = makerjs.model.combineSubtraction(g, t);

    return z;
  }

  z = makerjs.model.move(new logo(), [105, 0]);
  models.push(z);
  kicadData += kicad.model2kicadPolygon(z, "F.Cu", 0.050);
  kicadData += kicad.model2kicadPolygon(z, "F.Mask", 0.250);

  function dg23() {
    var logoData = [ [ 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, ],
                     [ 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, ],
                     [ 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1, ],
                     [ 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, ],
                     [ 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, ] ];

    const h = logoData.length;
    const w = logoData[0].length;

    for (var j = 0; j < h; j++) {
      for (var i = 0; i < w; i++) {
        if (logoData[j][logoData[j].length - i - 1]) {
          const d = 6.5;
          const step = 8;
          const pos = [matrixOrigin.x + (w - i) * step - d / 2 - step / 2, matrixOrigin.y + (h - j) * step - d / 2 - step / 2];
          const c = makerjs.model.move(new makerjs.models.Oval(d, d), pos);
          models.push(c);
          kicadData += kicad.model2kicadPolygon(c, "F.SilkS", 0.050);
        }
      }
    }
  }

  dg23();

  var bo = new boardOutline();
  models.push(bo);

  kicadData += kicad.model2kicadBoardOutline(bo);

  function gndPlane() {
    this.models = [];
    this.models.push(makerjs.model.move(new makerjs.models.Rectangle(31 * 2.54, 16 * 2.54), [-6 * 2.54, -5 * 2.54]));
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
  opentype.load('./Helvetica-Bold.otf', (e, f) => {
    font = f;
    var stuff = {
      models: {
        sb: new board(),
      }
    }
    var svg = makerjs.exporter.toSVG(stuff, { useSvgPathOnly: false, scale: 10 });
    document.write(svg);
  });
}
