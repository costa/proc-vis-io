$(function() {

  // TODO a shameless rip off dagre-d3 interactive demo

  // Input related code goes here

  function graphToURL() {
    var elems = [window.location.protocol, '//',
                 window.location.host,
                 window.location.pathname,
                 '?'];

    var queryParams = [];
    if (debugAlignment) {
      queryParams.push('alignment=' + debugAlignment);
    }
    queryParams.push('graph=' + encodeURIComponent(inputGraph.value));
    elems.push(queryParams.join('&'));

    return elems.join('');
  }

  var inputGraph = document.querySelector("#inputGraph");

  var graphLink = d3.select("#graphLink");

  var oldInputGraphValue;

  var graphRE = /[?&]graph=([^&]+)/;
  var graphMatch = window.location.search.match(graphRE);
  if (graphMatch) {
    inputGraph.value = decodeURIComponent(graphMatch[1]);
  }
  var debugAlignmentRE = /[?&]alignment=([^&]+)/;
  var debugAlignmentMatch = window.location.search.match(debugAlignmentRE);
  var debugAlignment;
  if (debugAlignmentMatch) debugAlignment = debugAlignmentMatch[1];

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

  function tryDraw() {
    var g;
    if (oldInputGraphValue !== inputGraph.value) {
      inputGraph.setAttribute("class", "");
      oldInputGraphValue = inputGraph.value;
      try {
        g = graphlibDot.read(inputGraph.value);
      } catch (e) {
        inputGraph.setAttribute("class", "error");
        throw e;
      }

      // Save link to new graph
      graphLink.attr("href", graphToURL());

      // Set margins, if not present
      if (!g.graph().hasOwnProperty("marginx") &&
          !g.graph().hasOwnProperty("marginy")) {
        g.graph().marginx = 20;
        g.graph().marginy = 20;
      }

      g.graph().transition = function(selection) {
        return selection.transition().duration(500);
      };

      // Render the graph into svg g
      d3.select("svg g").call(render, g);
    }
  }

  tryDraw();
  $('title', document).text("Viewing process #YYYYYY");

});
