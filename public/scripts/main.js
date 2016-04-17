// NOTE heavily based on https://github.com/cpettitt/dagre-d3/blob/master/demo/interactive-demo.html

var TRANSITION_DURATION_MS = 500;

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

    // inputGraph.setAttribute("class", "");
    var g;
    try {
      g = graphlibDot.read(graph);
    } catch (e) {
      // inputGraph.setAttribute("class", "error");
      throw e;
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
    return window.location.pathname = '/?pid=' + prompt('PID');
  }

  var procFB = new Firebase("https://proc-vis-io.firebaseio.com/").child('proc');

  function digraphy(dotData) {
    return "digraph {\n" +
      "node [rx=5 ry=5 labelStyle=\"font: 300 14px 'Helvetica Neue', Helvetica\"]\n" +
      "edge [labelStyle=\"font: 300 14px 'Helvetica Neue', Helvetica\"]\n" +
      dotData + "\n}"
  }

  procFB.child(pid).on('value', function(snapshot) {
    var data = snapshot && snapshot.val();
    var dotData = data && data.dot;
    if (!dotData) {
      dotData = "ZZZ [labelType=\"html\" label=\"<big>Waiting to hear from pid " + pid + "</big>\"];"
    }
    tryDraw(digraphy(dotData));
  });

  $('title', document).text("Viewing process #" + pid);
});
