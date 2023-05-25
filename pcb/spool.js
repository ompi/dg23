var makerjs = require('makerjs');

function windTrace(trace, spool, ccw) {
    if (typeof(trace.lastSpool) === 'undefined') {
        trace.lastSpool = spool;
        trace.lastTouchy = spool.p;
        trace.lastCcw = ccw;
        trace.pathData = `M ${spool.p.x} ${spool.p.y} `;
        trace.lineSegments = [];
        trace.paths = [];
        return;
    }

    var res;
    var large;
    var sweep;

    if (spool.t) {
        spool.r += trace.traceWidth / 2 + trace.minTraceSpacing;
    }

    if (trace.lastCcw == ccw) {
        res = geom.getCircle2Tangents(trace.lastSpool.p, trace.lastSpool.r, spool.p, spool.r);
    } else {
        res = geom.getCircle2Tangents2(trace.lastSpool.p, trace.lastSpool.r, spool.p, spool.r);
    }

    var r = trace.lastSpool.r;
    var start = trace.lastTouchy;

    var mid = ccw ? res.p1 : res.p2;
    var end = ccw ? res.p3 : res.p4;

    if (trace.lastCcw == ccw) {
        large = geom.getSide(start, mid, trace.lastSpool.p) ^ !ccw;
        sweep = ccw ? 0 : 1;
    } else {
        large = geom.getSide(start, mid, trace.lastSpool.p) ^ ccw;
        sweep = ccw;
    }

    trace.pathData += `A ${r} ${r} 0 ${large} ${sweep} ${mid.x} ${mid.y} L ${end.x} ${end.y} `;

    trace.paths.push(new makerjs.paths.Arc([trace.lastTouchy.x, trace.lastTouchy.y], 
                                           [mid.x, mid.y], r, large, !sweep));

    trace.paths.push(new makerjs.paths.Line([mid.x, mid.y], [end.x, end.y]));

    if (trace.lastSpool.t) {
        trace.lastSpool.r += trace.traceWidth / 2;
    }

/*    if (trace.lastSpool.u) {
        trace.lastSpool.r -= trace.traceWidth + trace.minTraceSpacing;
    } else {
        trace.lastSpool.r += trace.traceWidth + trace.minTraceSpacing;
    }*/

    trace.lastCcw = ccw;
    trace.lastTouchy = end;
    trace.lastSpool = spool;
    trace.lineSegments.push({ p1: mid, p2: end });
}

spool = {
    windTrace: windTrace,
}

if (typeof module != "undefined") {
    module.exports = {
        spool: spool,
    }
}
