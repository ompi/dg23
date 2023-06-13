var makerjs = require('makerjs');

var rules = {};
var nets = {};
var spools = {};

var netCounter = 1;

function setRules(r) {
  rules = r;
}

function getRules() {
  return rules;
}

function addNet(name) {
  nets[name] = { id: netCounter, name: name };
  netCounter++;
}

function dumpNets() {
  netData = "";

  Object.keys(nets).forEach(k => {
    var n = nets[k];
    netData += `(net ${n.id} "${n.name}")\n`;
  });

  return netData;
}

function dumpHeader() {
  var fs = require('fs');
  var header = fs.readFileSync('head.kicad_pcb');
  return header.toString();
}

function fix(n) {
  return Math.round(n * 1000) / 1000;
}

function polygonify(model) {
  var polys = [];

  makerjs.model.findChains(model, (chains, loose, layer) => {
    chains.forEach(ch => {
      var pts = makerjs.chain.toKeyPoints(ch, .05);

      var fixed = [];

      pts.forEach(p => {
        fixed.push([fix(p[0]), -fix(p[1])]);
      });

      polys.push(fixed);
    });

    loose.forEach(l => {
      var pts = makerjs.path.toKeyPoints(l.pathContext, .1);

      var fixed = [];

      pts.forEach(p => {
        fixed.push([fix(p[0]), -fix(p[1])]);
      });

      polys.push(fixed);
    });
  });

  return polys;
}

function polygonify2(model) {
  var polys = [];

  function push(positive, chain) {
    var pts = makerjs.chain.toKeyPoints(chain, .05);

    var fixed = [];

    pts.forEach(p => {
      fixed.push([fix(p[0]), -fix(p[1])]);
    });

    polys.push({ positive: positive, points: fixed });
  }

  function explore(chains) {
    nextChains = [];

    chains.forEach(pos => {
      push(true, pos);

      if (pos.contains !== undefined)
        pos.contains.forEach(neg => {
          push(false, neg);

          if (neg.contains !== undefined)
            nextChains = nextChains.concat(neg.contains);
        });
    });

    if (nextChains.length)
      explore(nextChains);
  }

  makerjs.model.findChains(model, (chains, loose, layer) => {
    explore(chains);

    loose.forEach(l => {
      var pts = makerjs.path.toKeyPoints(l.pathContext, .1);

      var fixed = [];

      pts.forEach(p => {
        fixed.push([fix(p[0]), -fix(p[1])]);
      });

      polys.push(fixed);
    });
  }, { contain: true });

  return polys;
}

function model2kicadPolygon(model, layer, mt) {
  var kicadData = "";
  
  var poly = polygonify2(model);

  while(poly.length) {
    var p = poly.shift();

    if (p.positive) {
//console.log('h');
      kicadData += `(zone (net 0) (net_name "") (layer ${layer}) (tstamp 5A463F51) (hatch edge 0.508)\n`;
      kicadData += `  (connect_pads (clearance ${rules.minTraceSpacing}))\n`;
      kicadData += `  (min_thickness ${mt})\n`;
      kicadData += `  (fill yes (arc_segments 16) (thermal_gap ${rules.minTraceSpacing}) (thermal_bridge_width ${rules.minTraceSpacing}))\n`;
    }
//console.log(p)

    var points = "";

    p.points.forEach((p) => {
      points += `      (xy ${p[0]} ${p[1]})\n`;
    });

    kicadData += `  (polygon\n`;
    kicadData += `    (pts\n`;
    kicadData += points;
    kicadData += `    )\n`;
    kicadData += `  )\n`;

    if (!poly.length) {
//console.log('f');
      kicadData += `)\n`;
    } else if (poly[0].positive) {
//console.log('f');
      kicadData += `)\n`;
    }

    positive = p.positive;
  }

  return kicadData;
}

function model2kicadFill(model, layer, netName) {
  var kicadData = "";

  net = nets[netName];
  
  polygonify(model).forEach(pts => {
    var points = "";

    pts.forEach((p) => {
      points += `      (xy ${p[0]} ${p[1]})\n`;
    });

    kicadData += `(zone (net ${net.id}) (net_name "${net.name}") (layer ${layer}) (tstamp 5A463F51) (hatch edge 0.508)\n`;
    kicadData += `  (connect_pads (clearance ${rules.minTraceSpacing}))\n`;
    kicadData += `  (min_thickness ${rules.minTraceSpacing})\n`;
    kicadData += `  (fill yes (arc_segments 16) (thermal_gap ${rules.minTraceSpacing}) (thermal_bridge_width ${rules.minTraceSpacing + 1e-3}))\n`;
    kicadData += `  (polygon\n`;
    kicadData += `    (pts\n`;
    kicadData += points;
    kicadData += `    )\n`;
    kicadData += `  )\n`;
    kicadData += `)\n`;
  });

  return kicadData;
}

function model2kicadBoardOutline(model) {
  var kicadData = "";

  polygonify(model).forEach(pts => {
    pts.push(pts[0]);

    while(pts.length > 1) {
      var s = pts.shift();
      var e = pts[0];
      kicadData += `(gr_line (start ${s[0]} ${s[1]}) (end ${e[0]} ${e[1]}) (width 0.0001) (layer Edge.Cuts))\n`;
    }
  });

  return kicadData;
}

function trace2kicadTrace(trace, layer, n) {
  var kicadData = "";

  var width = trace.traceWidth;

  var net = 0;
  if (typeof n != 'undefined') {
    net = nets[n].id;
  }

  polygonify(trace).forEach(pts => {
    while(pts.length > 1) {
      var s = pts.shift();
      var e = pts[0];
      kicadData += `(segment (start ${s[0]} ${s[1]}) (end ${e[0]} ${e[1]}) (width ${width}) (layer ${layer}) (net ${net}))\n`;
    }
  });

  return kicadData;
}

function hole(p, holeRadius, copperRadius, net) {
  this.paths = [
    new makerjs.paths.Circle(p, holeRadius),
    new makerjs.paths.Circle(p, copperRadius),
  ];

  this.kicadData = `(module y (layer F.Cu)\n`;
  this.kicadData += `  (pad x thru_hole circle (at ${fix(p[0])} ${-fix(p[1])}) (size ${copperRadius * 2} ${copperRadius * 2}) (drill ${holeRadius * 2}) (layers *.Cu *.Mask) ${net})\n`;
  this.kicadData += ')\n';
}

function terminal(refDes, p, n) {
  var holeRadius = 0.8 / 2;
  var copperRadius = holeRadius + 0.5;

  var net = "";
  if (typeof n != 'undefined') {
    net = `(net ${nets[n].id} "${nets[n].name}")`;
  }

  addSpool(`${refDes}.C`, { p: { x: p[0], y: p[1] }, r: 0.005 });
  addSpool(`${refDes}.T`, { p: { x: p[0], y: p[1] }, r: copperRadius, t: true });

  var h = new hole(p, holeRadius, copperRadius, net);
  this.models = [ h ];
  this.kicadData = h.kicadData;
}

function mountHole(refDes, p, n) {
  var holeRadius = 2.5 / 2;
  var copperRadius = 5.8 / 2; // 5.4 / 2;

  var net = "";
  if (typeof n != 'undefined') {
    net = `(net ${nets[n].id} "${nets[n].name}")`;
  }

  addSpool(`${refDes}.C`, { p: { x: p[0], y: p[1] }, r: 0.005 });
  addSpool(`${refDes}.T`, { p: { x: p[0], y: p[1] }, r: copperRadius, t: true });

  var h = new hole(p, holeRadius, copperRadius, net);
  this.models = [ h ];
  this.kicadData = h.kicadData;
}

function matrixHole(refDes, p, n) {
  var holeRadius = 2.1 / 2;
  var copperRadius = 4 / 2;

  var net = "";
  if (typeof n != 'undefined') {
    net = `(net ${nets[n].id} "${nets[n].name}")`;
  }

  addSpool(`${refDes}.C`, { p: { x: p[0], y: p[1] }, r: 0.005 });
  addSpool(`${refDes}.T`, { p: { x: p[0], y: p[1] }, r: copperRadius, t: true });

  var h = new hole(p, holeRadius, copperRadius, net);
  this.models = [ h ];
  this.kicadData = h.kicadData;
}

function pinHole(refDes, p, n) {
  var holeRadius = 0.8 / 2;
  var copperRadius = 1.6 / 2;

  var net = "";
  if (typeof n != 'undefined') {
    net = `(net ${nets[n].id} "${nets[n].name}")`;
  }

  addSpool(`${refDes}.C`, { p: { x: p[0], y: p[1] }, r: 0.005 });
  addSpool(`${refDes}.T`, { p: { x: p[0], y: p[1] }, r: copperRadius, t: true });

  var h = new hole(p, holeRadius, copperRadius, net);
  this.models = [ h ];
  this.kicadData = h.kicadData;
}

function hoopHole(refDes, p, n) {
  var holeRadius = 2 / 2;

  var net = "";
  if (typeof n != 'undefined') {
    net = `(net ${nets[n].id} "${nets[n].name}")`;
  }

  addSpool(`${refDes}.C`, { p: { x: p[0], y: p[1] }, r: 0.005 });
  addSpool(`${refDes}.T`, { p: { x: p[0], y: p[1] }, r: holeRadius, t: true });

  var h = new hole(p, holeRadius, 1, net);
  this.models = [ h ];
  this.kicadData = h.kicadData;
}

function via(refDes, p, n) {
  var holeRadius =  rules.minHoleDiameter / 2;
  var copperRadius = holeRadius + rules.minPadDiameter / 2;

  this.paths = [
    new makerjs.paths.Circle(p, holeRadius),
    new makerjs.paths.Circle(p, copperRadius),
  ];

  var netId = 0;
  if (typeof n != 'undefined') {
    netId = nets[n].id;
  }

  addSpool(`${refDes}.C`, { p: { x: p[0], y: p[1] }, r: 0.005 });
  addSpool(`${refDes}.T`, { p: { x: p[0], y: p[1] }, r: copperRadius, t: true });

  this.kicadData = `(via (at ${fix(p[0])} ${-fix(p[1])}) (size ${copperRadius * 2}) (drill ${holeRadius * 2}) (layers F.Cu B.Cu) (net ${netId}))\n`;
  this.kicadData += `(gr_circle (center ${fix(p[0])} ${-fix(p[1])}) (end ${fix(p[0]) + copperRadius + rules.minTraceSpacing} ${-fix(p[1])}) (layer F.SilkS) (width 0.01))\n`;
  this.kicadData += `(gr_circle (center ${fix(p[0])} ${-fix(p[1])}) (end ${fix(p[0]) + copperRadius + rules.minTraceSpacing} ${-fix(p[1])}) (layer B.SilkS) (width 0.01))\n`;
}

function addSpool(name, spool) {
  spool.rOriginal = spool.r;
  spools[name] = spool;
}

function getSpool(name) {
  return spools[name];
}

function dumpSpools() {
  Object.keys(spools).forEach(n => {
    console.log(n, spools[n])
  });
}

function package0603(refDes, x, y, a, m, netAssignment) {
  var pads = [];

  var w = 750e-3;
  var h = 800e-3;
  var vp = 750e-3;

  pads.push({ x: 0, y: vp, w: w , h: h });
  pads.push({ x: 0, y: -vp, w: w , h: h });

  return new package(refDes, pads, x, y, a, m, netAssignment);
}

function package0402(refDes, x, y, a, m, netAssignment) {
  var pads = [];

  var w = 500e-3;
  var h = 600e-3;
  var vp = 550e-3;

  pads.push({ x: 0, y: vp, w: w , h: h });
  pads.push({ x: 0, y: -vp, w: w , h: h });

  return new package(refDes, pads, x, y, a, m, netAssignment);
}

function packageTqfn28(refDes, x, y, a, m, netAssignment) {
  var pads = [];

  var w = 300e-3;
  var h = 950e-3;
  var sp = 500e-3;
  var bp = 4680e-3 / 2;
  var ep = 3250e-3;

  for (var i = -3; i <= 3; i++) {
    pads.push({ x: sp * i, y: -bp, w: w, h: h });
  }

  for (var i = -3; i <= 3; i++) {
    pads.push({ x: bp, y: sp * i, w: h, h: w });
  }

  for (var i = 3; i >= -3; i--) {
    pads.push({ x: sp * i, y: bp, w: w, h: h });
  }

  for (var i = 3; i >= -3; i--) {
    pads.push({ x: -bp, y: sp * i, w: h, h: w });
  }

  pads.push({ x: 0, y: 0, w: ep, h: ep });

  return new package(refDes, pads, x, y, a, m, netAssignment);
}

function packageQfn32(refDes, x, y, a, m, netAssignment) {
  var pads = [];

  var w = 250e-3;
  var h = 800e-3;
  var sp = 500e-3;
  var bp = 4850e-3 / 2;
  var ep = 3400e-3;

  for (var i = -4; i <= 3; i++) {
    pads.push({ x: sp * (i + 0.5), y: -bp, w: w, h: h });
  }

  for (var i = -4; i <= 3; i++) {
    pads.push({ x: bp, y: sp * (i + 0.5), w: h, h: w });
  }

  for (var i = 3; i >= -4; i--) {
    pads.push({ x: sp * (i + 0.5), y: bp, w: w, h: h });
  }

  for (var i = 3; i >= -4; i--) {
    pads.push({ x: -bp, y: sp * (i + 0.5), w: h, h: w });
  }

  pads.push({ x: 0, y: 0, w: ep, h: ep });

  return new package(refDes, pads, x, y, a, m, netAssignment);
}

function packageUsbC(refDes, x, y, a, m, netAssignment) {
  var pads = [];

  var bw = 1180e-3;
  var bh = 1850e-3;

  var bx = 7280e-3 / 2;
  var mx = 5500e-3 / 2;

  var sw = 300e-3;
  var sh = 1250e-3;

  var hp = 500e-3;

  pads.push({ x: -bx, y: 0, w: bw , h: bh });
  pads.push({ x: -mx, y: 0, w: sw , h: bh });

  for (var i = -5; i <= 4; i++) {
    pads.push({ x: hp * i + hp / 2, y: 0, w: sw , h: sh });
  }

  pads.push({ x: mx, y: 0, w: sw , h: bh });
  pads.push({ x: bx, y: 0, w: bw , h: bh });

  return new package(refDes, pads, x, y, a, m, netAssignment);
}

function packageMsop(refDes, x, y, a, m, netAssignment) {
  var pads = [];

  var w = 305e-3;
  var h = 889e-3;
  var hp = 500e-3;
  var vp = 5100e-3;

  for (var i = -2; i <= 2; i++) {
    pads.push({ x: i * hp, y: -(vp - h) / 2, w: w , h: h });
  }

  for (var i = 2; i >= -2; i--) {
    pads.push({ x: i * hp, y: (vp - h) / 2, w: w , h: h });
  }

  return new package(refDes, pads, x, y, a, m, netAssignment);
}

function packageSc70(refDes, x, y, a, m, netAssignment) {
  var pads = [];

  var w = 400e-3;
  var h = 500e-3;
  var hp = 650e-3;
  var vp = 1900e-3;

  for (var i = -1; i <= 1; i++) {
    pads.push({ x: i * hp, y: -vp / 2, w: w , h: h });
  }

  for (var i = 1; i >= -1; i--) {
    if (i != 0) {
      pads.push({ x: i * hp, y: vp / 2, w: w , h: h });
    }
  }

  return new package(refDes, pads, x, y, a, m, netAssignment);
}

function packageSot666(refDes, x, y, a, m, netAssignment) {
  var pads = [];

  var w = 350e-3;
  var h = 500e-3;
  var hp = 500e-3;
  var vp = 800e-3 + h;

  for (var i = -1; i <= 1; i++) {
    pads.push({ x: i * hp, y: -vp / 2, w: w , h: h });
  }

  for (var i = 1; i >= -1; i--) {
    pads.push({ x: i * hp, y: vp / 2, w: w , h: h });
  }

  return new package(refDes, pads, x, y, a, m, netAssignment);
}

function packageThd2P(refDes, x, y, a, m, netAssignment) {
  var pads = [];

  const hs = 2.54;
  const pd = 1.6;
  const hd = 0.8;

  pads.push({ x: -hs / 2, y: 0, pd: pd, hd: hd });
  pads.push({ x: hs / 2, y: 0, pd: pd, hd: hd });

  return new dip(refDes, pads, x, y, a, m, netAssignment);
}

function packageDip14(refDes, x, y, a, m, netAssignment) {
  var pads = [];

  const hs = 2.54 * 3;
  const vs = 2.54;
  const pd = 1.6;
  const hd = 0.8;

  for (var i = 3; i >= -3; i--) {
    pads.push({ x: -hs / 2, y: vs * i, pd: pd, hd: hd });
  }

  for (var i = -3; i <= 3; i++) {
    pads.push({ x: hs / 2, y: vs * i, pd: pd, hd: hd });
  }

  return new dip(refDes, pads, x, y, a, m, netAssignment);
}

function packageDip16(refDes, x, y, a, m, netAssignment) {
  var pads = [];

  const hs = 2.54 * 3;
  const vs = 2.54;
  const pd = 1.6;
  const hd = 0.8;

  for (var i = 4; i >= -3; i--) {
    pads.push({ x: -hs / 2, y: vs * i - vs / 2, pd: pd, hd: hd });
  }

  for (var i = -3; i <= 4; i++) {
    pads.push({ x: hs / 2, y: vs * i - vs / 2, pd: pd, hd: hd });
  }

  return new dip(refDes, pads, x, y, a, m, netAssignment);
}

function packageSip10(refDes, x, y, a, m, netAssignment) {
  var pads = [];

  const hs = 2.54;
  const pd = 1.6;
  const hd = 0.8;

  for (var i = 0; i < 10; i++) {
    pads.push({ x: hs * i, y: 0, pd: pd, hd: hd });
  }

  return new dip(refDes, pads, x, y, a, m, netAssignment);
}

function connector22(refDes, x, y, a, m, netAssignment) {
  var pads = [];

  const hs = 2.54;
  const pd = 1.7;
  const hd = 1.0;

  for (var i = 0; i < 22; i++) {
    pads.push({ x: hs * i, y: 0, pd: pd, hd: hd });
  }

  return new dip(refDes, pads, x, y, a, m, netAssignment);
}

function potRk09(refDes, x, y, a, m, netAssignment) {
  var pads = [];

  const pd = 1.6;
  const hd = 1;
  const e = 0.8;
  const hw = 1.8;
  const hh = 3.8;

  pads.push({ x: -2.5, y: -7, pd: pd, hd: hd });
  pads.push({ x: 0, y: -7, pd: pd, hd: hd });
  pads.push({ x: 2.5, y: -7, pd: pd, hd: hd });

  pads.push({ x: -10.6 / 2, y: 0, pw: hw + e, ph: hh + e, hw: hw, hh: hh });
  pads.push({ x: 10.6 / 2, y: 0, pw: hw + e, ph: hh + e, hw: hw, hh: hh });

  return new dip(refDes, pads, x, y, a, m, netAssignment);
}

function package(refDes, pads, x, y, a, flipped, netAssignment) {
  var kicadData = "";

  var models = [];
  var paths = [];

  var fanoutR = 300e-3;

  var m = 1;
  var layer = 'F';

  if (flipped) {
    m = -1;
    layer = 'B';
  }

  pads.forEach((p,i) => {
    po = geom.cartesian2polar(p.x * m, p.y);
    po.a += a * Math.PI / 180;
    o = geom.polar2cartesian(po.r, po.a);

    c = { x: x + o.x, y: y + o.y };

    // Clearance
    pb = geom.cartesian2polar(p.w / 2 * m, -p.h / 2);
    pb.a += a * Math.PI / 180;
    b = geom.polar2cartesian(pb.r, pb.a);

    cse = { x: c.x + b.x, y: c.y + b.y };

    pb = geom.cartesian2polar(p.w / 2 * m, p.h / 2);
    pb.a += a * Math.PI / 180;
    b = geom.polar2cartesian(pb.r, pb.a);

    cne = { x: c.x + b.x, y: c.y + b.y };

    pb = geom.cartesian2polar(-p.w / 2 * m, p.h / 2);
    pb.a += a * Math.PI / 180;
    b = geom.polar2cartesian(pb.r, pb.a);

    cnw = { x: c.x + b.x, y: c.y + b.y };

    pb = geom.cartesian2polar(-p.w / 2 * m, -p.h / 2);
    pb.a += a * Math.PI / 180;
    b = geom.polar2cartesian(pb.r, pb.a);

    csw = { x: c.x + b.x, y: c.y + b.y };

    // Fanout North-South
    pf = geom.cartesian2polar(fanoutR * m, -p.h / 2);
    pf.a += a * Math.PI / 180;
    b = geom.polar2cartesian(pf.r, pf.a);

    fse = { x: c.x + b.x, y: c.y + b.y };

    pf = geom.cartesian2polar(fanoutR * m, p.h / 2);
    pf.a += a * Math.PI / 180;
    b = geom.polar2cartesian(pf.r, pf.a);

    fne = { x: c.x + b.x, y: c.y + b.y };

    pf = geom.cartesian2polar(-fanoutR * m, p.h / 2);
    pf.a += a * Math.PI / 180;
    b = geom.polar2cartesian(pf.r, pf.a);

    fnw = { x: c.x + b.x, y: c.y + b.y };

    pf = geom.cartesian2polar(-fanoutR * m, -p.h / 2);
    pf.a += a * Math.PI / 180;
    b = geom.polar2cartesian(pf.r, pf.a);

    fsw = { x: c.x + b.x, y: c.y + b.y };

    // Fanout East-West
    pf = geom.cartesian2polar(p.w / 2, -fanoutR * m);
    pf.a += a * Math.PI / 180;
    b = geom.polar2cartesian(pf.r, pf.a);

    f2se = { x: c.x + b.x, y: c.y + b.y };

    pf = geom.cartesian2polar(p.w / 2, fanoutR * m);
    pf.a += a * Math.PI / 180;
    b = geom.polar2cartesian(pf.r, pf.a);

    f2ne = { x: c.x + b.x, y: c.y + b.y };

    pf = geom.cartesian2polar(-p.w / 2, fanoutR * m);
    pf.a += a * Math.PI / 180;
    b = geom.polar2cartesian(pf.r, pf.a);

    f2nw = { x: c.x + b.x, y: c.y + b.y };

    pf = geom.cartesian2polar(-p.w / 2, -fanoutR * m);
    pf.a += a * Math.PI / 180;
    b = geom.polar2cartesian(pf.r, pf.a);

    f2sw = { x: c.x + b.x, y: c.y + b.y };

    addSpool(`${refDes}.P${i + 1}.C`, { p: c, r: 0.005 });

    addSpool(`${refDes}.P${i + 1}.C.NW`, { p: cnw, r: 0, t: true });
    addSpool(`${refDes}.P${i + 1}.C.NE`, { p: cne, r: 0, t: true });
    addSpool(`${refDes}.P${i + 1}.C.SW`, { p: csw, r: 0, t: true });
    addSpool(`${refDes}.P${i + 1}.C.SE`, { p: cse, r: 0, t: true });

    addSpool(`${refDes}.P${i + 1}.FNS.NW`, { p: fnw, r: fanoutR });
    addSpool(`${refDes}.P${i + 1}.FNS.NE`, { p: fne, r: fanoutR });
    addSpool(`${refDes}.P${i + 1}.FNS.SW`, { p: fsw, r: fanoutR });
    addSpool(`${refDes}.P${i + 1}.FNS.SE`, { p: fse, r: fanoutR });

    addSpool(`${refDes}.P${i + 1}.FEW.NW`, { p: f2nw, r: fanoutR });
    addSpool(`${refDes}.P${i + 1}.FEW.NE`, { p: f2ne, r: fanoutR });
    addSpool(`${refDes}.P${i + 1}.FEW.SW`, { p: f2sw, r: fanoutR });
    addSpool(`${refDes}.P${i + 1}.FEW.SE`, { p: f2se, r: fanoutR });
  });

  function mod() {
    this.models = [];
    pads.forEach((p) => {
      this.models.push(makerjs.model.move(new makerjs.models.Rectangle(p.w, p.h), [p.x - p.w / 2, p.y - p.h / 2]));
    });
  }

  function compass() {
    const s = .5;
    this.models = {
      compass: {
        paths: [
          new makerjs.paths.Line([0,0], [0,s * 4]),
          new makerjs.paths.Line([0,s * 4], [s * m,0]),
          new makerjs.paths.Line([s * m,0], [0,0]),
        ]
      }
    }
  }

  models.push(makerjs.model.move(makerjs.model.rotate(new mod(), a), [x, y]));
  models.push(makerjs.model.move(makerjs.model.rotate(new compass(), a), [x, y]));

  kicadData += `(module wut:fos (layer ${layer}.Cu)\n`;
  kicadData += `  (at ${x} ${-y} ${a})\n`;

  pads.forEach((p, i) => {
    var net = "";
    var n = netAssignment[i];
    if (typeof n != 'undefined') {
      net = `(net ${nets[n].id} "${nets[n].name}")`;
    }

    kicadData += `  (pad ${i+1} smd rect (at ${p.x * m} ${-p.y} ${a}) (size ${p.w} ${p.h}) (layers ${layer}.Cu ${layer}.Paste ${layer}.Mask)\n`;
    kicadData += `    ${net})\n`;
  });

  kicadData += `)\n`; // end of module

  this.pads = pads;
  this.models = models;
  this.paths = paths;
  this.kicadData = kicadData;
}

function dip(refDes, pads, x, y, a, flipped, netAssignment) {
  var kicadData = "";

  var models = [];
  var paths = [];

  var m = 1;
  var layer = 'F';

  if (flipped) {
    m = -1;
    layer = 'B';
  }

  pads.forEach((p,i) => {
    po = geom.cartesian2polar(p.x * m, p.y);
    po.a += a * Math.PI / 180;
    o = geom.polar2cartesian(po.r, po.a);

    c = { x: x + o.x, y: y + o.y };
    addSpool(`${refDes}.P${i + 1}.C`, { p: c, r: 0.005 });

    if (p.pw != undefined) {
      d = Math.min(p.pw, p.ph);
      w = p.pw - d;
      h = p.ph - d;

      // Clearance
      pb = geom.cartesian2polar(w / 2 * m, -h / 2);
      pb.a += a * Math.PI / 180;
      b = geom.polar2cartesian(pb.r, pb.a);

      cse = { x: c.x + b.x, y: c.y + b.y };

      pb = geom.cartesian2polar(w / 2 * m, h / 2);
      pb.a += a * Math.PI / 180;
      b = geom.polar2cartesian(pb.r, pb.a);

      cne = { x: c.x + b.x, y: c.y + b.y };

      pb = geom.cartesian2polar(w / 2 * m, h / 2);
      pb.a += a * Math.PI / 180;
      b = geom.polar2cartesian(pb.r, pb.a);

      cnw = { x: c.x + b.x, y: c.y + b.y };

      pb = geom.cartesian2polar(w / 2 * m, -h / 2);
      pb.a += a * Math.PI / 180;
      b = geom.polar2cartesian(pb.r, pb.a);

      csw = { x: c.x + b.x, y: c.y + b.y };

      r = Math.min(p.pw, p.ph) / 2;

      addSpool(`${refDes}.P${i + 1}.C.NW`, { p: cnw, r: r, t: true });
      addSpool(`${refDes}.P${i + 1}.C.NE`, { p: cne, r: r, t: true });
      addSpool(`${refDes}.P${i + 1}.C.SW`, { p: csw, r: r, t: true });
      addSpool(`${refDes}.P${i + 1}.C.SE`, { p: cse, r: r, t: true });
    } else {
      addSpool(`${refDes}.P${i + 1}.T`, { p: c, r: p.pd / 2, t: true });
    }
  });

  function mod() {
    this.models = [];
    pads.forEach((p) => {
      if (p.pd !== undefined) {
        this.models.push(makerjs.model.move(new makerjs.models.Oval(p.pd, p.pd), [p.x - p.pd / 2, p.y - p.pd / 2]));
      } else {
        this.models.push(makerjs.model.move(new makerjs.models.Oval(p.pw, p.ph), [p.x - p.pw / 2, p.y - p.ph / 2]));
      }
    });
  }

  function compass() {
    const s = .5;
    this.models = {
      compass: {
        paths: [
          new makerjs.paths.Line([0,0], [0,s * 4]),
          new makerjs.paths.Line([0,s * 4], [s * m,0]),
          new makerjs.paths.Line([s * m,0], [0,0]),
        ]
      }
    }
  }

  models.push(makerjs.model.move(makerjs.model.rotate(new mod(), a), [x, y]));
  models.push(makerjs.model.move(makerjs.model.rotate(new compass(), a), [x, y]));

  kicadData += `(module wut:fos (layer ${layer}.Cu)\n`;
  kicadData += `  (at ${x} ${-y} ${a})\n`;

  pads.forEach((p, i) => {
    var net = "";
    var n = netAssignment[i];
    if (typeof n != 'undefined') {
      net = `(net ${nets[n].id} "${nets[n].name}")`;
    }

    if (p.pd !== undefined) {
      kicadData += `  (pad ${i+1} thru_hole oval (at ${p.x * m} ${-p.y} ${a}) (size ${p.pd} ${p.pd}) (drill ${p.hd}) (layers *.Cu *.Mask)\n`;
    } else {
      kicadData += `  (pad ${i+1} thru_hole oval (at ${p.x * m} ${-p.y} ${a}) (size ${p.pw} ${p.ph}) (drill ${p.hw} ${p.hh}) (layers *.Cu *.Mask)\n`;
    }
    kicadData += `    ${net})\n`;
  });

  kicadData += `)\n`; // end of module

  this.pads = pads;
  this.models = models;
  this.paths = paths;
  this.kicadData = kicadData;
}

kicad = {
    getRules: getRules,
    setRules: setRules,
    hoopHole: hoopHole,
    pinHole: pinHole,
    via: via,
    terminal: terminal,
    mountHole: mountHole,
    matrixHole: matrixHole,
    addNet: addNet,
    dumpNets: dumpNets,
    dumpHeader: dumpHeader,
    model2kicadPolygon: model2kicadPolygon,
    model2kicadFill: model2kicadFill,
    model2kicadBoardOutline: model2kicadBoardOutline,
    trace2kicadTrace: trace2kicadTrace,
    package0402: package0402,
    package0603: package0603,
    packageMsop: packageMsop,
    packageSc70: packageSc70,
    packageSot666: packageSot666,
    packageUsbC: packageUsbC,
    packageTqfn28: packageTqfn28,
    packageQfn32: packageQfn32,
    packageThd2P: packageThd2P,
    packageDip14: packageDip14,
    packageDip16: packageDip16,
    packageSip10: packageSip10,
    connector22: connector22,
    potRk09: potRk09,
    addSpool: addSpool,
    getSpool: getSpool,
}

if (typeof module != "undefined") {
    module.exports = {
        kicad: kicad,
    }
}
