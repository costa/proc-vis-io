// NOTE heavily based on https://github.com/cpettitt/dagre-d3/blob/master/demo/interactive-demo.html

var TRANSITION_DURATION_MS = 500;
var DRAW_FPS = 1;

$(function() {

  // Set up zoom support
  var svg = d3.select("svg"),
      inner = d3.select("svg g"),
      zoom = d3.behavior.zoom().on("zoom", function() {
        inner.attr("transform", "translate(" + d3.event.translate + ")" +
                   "scale(" + d3.event.scale + ")");
      });
  svg.call(zoom);

  // Create and configure the renderer
  var render = dagreD3.render();

  var oldGraph;

  function tryDraw(graph) {
    if (oldGraph == graph) {
      return;
    }

    var g;
    try {
      g = graphlibDot.read(graph);
    } catch (e) {
      console.error(graph)
      console.error(e);
      g =  graphlibDot.read(digraphy("EEE [labelType=\"html\" label=\"<big style='color:red;'>Error parsing data from pid " + pid + "</big>\"];"));
    }

    // Set margins, if not present
    if (!g.graph().hasOwnProperty("marginx") &&
        !g.graph().hasOwnProperty("marginy")) {
      g.graph().marginx = 20;
      g.graph().marginy = 20;
    }

    g.graph().transition = function(selection) {
      return selection.transition().duration(TRANSITION_DURATION_MS);
    };

    // Render the graph into svg g
    d3.select("svg g").call(render, g);

    oldGraph = graph;
  }

  var pidRE = /[?&]pid=([^&]+)/;
  var pidMatch = window.location.search.match(pidRE);
  var pid = pidMatch && decodeURIComponent(pidMatch[1]);

  if (!pid) {
    return window.location =
      [
        window.location.protocol, '//', window.location.host, window.location.pathname, '?pid=' + prompt('PID')
      ].join('');
  }

  var procFB = new Firebase("https://proc-vis-io.firebaseio.com/").child('proc');

  function digraphy(dotData) {
    return "digraph {\n" +
      "node [rx=5 ry=5 labelStyle=\"font: 300 14px 'Helvetica Neue', Helvetica\"]\n" +
      "edge [labelStyle=\"font: 300 14px 'Helvetica Neue', Helvetica\"]\n" +
      dotData + "\n}"
  }

  var newSnapshot;
  procFB.child(pid).on('value', _.throttle(function(snapshot) {
    newSnapshot = snapshot;
  }, 1000 / DRAW_FPS));

  var renderLoop = function() {
    var snapshot = newSnapshot;
    newSnapshot = null;
    if (snapshot) {
      var data = snapshot && snapshot.val();
      var dotData = data && data.dot;
      if (!dotData) {
        dotData = "ZZZ [labelType=\"html\" label=\"<big>Waiting to hear from pid " + pid + "</big>\"];"
      }
      tryDraw(digraphy(dotData));
    }
    return setTimeout(renderLoop, 1000 / DRAW_FPS);
  };
  renderLoop();

  $('title', document).text("Viewing process #" + pid);
});
