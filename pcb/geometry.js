function getDistance(p1, p2) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;

    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}

function getCircle2Intersection(p1, r1, p2, r2) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    var d = getDistance(p1, p2);

    var a = (Math.pow(r1, 2) - Math.pow(r2, 2) + Math.pow(d, 2)) / (2 * d);
    var px = p1.x + (dx * a / d);
    var py = p1.y + (dy * a / d);

    var h = Math.sqrt(Math.pow(r1, 2) - Math.pow(a, 2));
    var rx = -dy * (h / d);
    var ry = dx * (h / d);

    var i1 = { x: px + rx, y: py + ry };
    var i2 = { x: px - rx, y: py - ry };

    return { p1: i1, p2: i2 };
}

function getCircle2Touch(p1, r1, p2, r2) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    var d = getDistance(p1, p2);
    
    if (d < Math.max(r1, r2)) {
        var x = p1.x + dx * r1 / (r1 - r2);
        var y = p1.y + dy * r1 / (r1 - r2);
    } else {
        var x = p1.x + dx * r1 / (r1 + r2);
        var y = p1.y + dy * r1 / (r1 + r2);
    }

    return { x: x, y: y };
}

function getCircle2Tangents(p1, r1, p2, r2) {
    var D = getDistance(p1, p2);

    var dpow = Math.pow(D, 2) - Math.pow(r1 - r2, 2);
    var d = Math.sqrt(dpow);
    var z = Math.sqrt(dpow + Math.pow(r2, 2));

    var i = getCircle2Intersection(p1, r1, p2, z);

    var i1 = getCircle2Intersection(i.p1, d, p2, r2);
    var i2 = getCircle2Intersection(i.p2, d, p2, r2);

    if (getDistance(i1.p1, p1) > r1) {
        return { p1: i.p1, p2: i.p2, p3: i1.p1, p4: i2.p2 };
    }

    return { p1: i.p1, p2: i.p2, p3: i1.p2, p4: i2.p1 };
}

function getCircle2Tangents2(p1, r1, p2, r2) {
    var D = getDistance(p1, p2);

    var D1 = D / (1 + r2 / r1);
    var D2 = D / (1 + r1 / r2);

    var d1 = Math.sqrt(Math.pow(D1, 2) - Math.pow(r1, 2));
    var d2 = Math.sqrt(Math.pow(D2, 2) - Math.pow(r2, 2));

    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;

    var mx = p1.x + dx / (1 + r2 / r1);
    var my = p1.y + dy / (1 + r2 / r1);

    var m = { x: mx, y: my };

    var i1 = getCircle2Intersection(m, d1, p1, r1);
    var i2 = getCircle2Intersection(m, d2, p2, r2);

    return { p1: i1.p1, p2: i1.p2, p3: i2.p1, p4: i2.p2 };
}

function getSide(s, e, p) {
    return ((e.x - s.x) * (p.y - s.y) - (e.y - s.y) * (p.x - s.x)) > 0 ? 1 : 0;
}

function getLineDistance(s, e, p) {
    return Math.abs((e.x - s.x) * (s.y - p.y) - (s.x - p.x) * (e.y - s.y)) / getDistance(s, e);
}

function getInLine(s, e, p) {
    var ax = s.x - e.x;
    var ay = s.y - e.y;

    var bx = s.x - p.x;
    var by = s.y - p.y;

    var r = getDistance(s, e);
    var c = (ax * bx + ay * by) / r / getDistance(s, p);

    bx = e.x - p.x;
    by = e.y - p.y;

    var d = (ax * bx + ay * by) / r / getDistance(e, p);

    return (c > 0) && (d < 0);
}

function polar2cartesian(r, a) {
    var x = r * Math.cos(a);
    var y = r * Math.sin(a);
    return { x: x, y: y };
}

function cartesian2polar(x, y) {
    var r = getDistance({ x: 0, y: 0 }, { x: x, y: y });
    var a = Math.atan2(y, x);
    return { r: r, a: a };
}

geom = {
    getDistance: getDistance,
    getCircle2Intersection: getCircle2Intersection,
    getCircle2Touch: getCircle2Touch,
    getCircle2Tangents: getCircle2Tangents,
    getCircle2Tangents2: getCircle2Tangents2,
    getSide: getSide,
    polar2cartesian: polar2cartesian,
    cartesian2polar: cartesian2polar,
}

if (typeof module != "undefined") {
    module.exports = {
        geom: geom,
    }
}
