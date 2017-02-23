// ------------------------- inspired by http://bl.ocks.org/ganeshv/6a8e9ada3ab7f2d88022 -------------------------------

// Add a truncate function to the string object
String.prototype.trunc = function(n){
    return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
};

var defaults = {
    margin: {top: 24, right: 0, bottom: 0, left: 0},
    rootname: "TOP",
    format: "$,.2f",
    title: "",
    width: 1000,
    height: 650
};

function main(o, data) {
    var opts = $.extend(true, {}, defaults, o),
        formatNumber = d3.format(opts.format),
        margin = opts.margin,
        minVar = Infinity,
        maxVar = -Infinity;

    // specify the margins
    var width = $('#treemap').width() - margin.left - margin.right,
        height = 9/16*$('#treemap').width() - margin.top - margin.bottom,
        transitioning;

    // coloring for groups
    var color = d3.scale.category20c();

    // x and y scale for the treemap
    var x = d3.scale.linear()
        .domain([0, width])
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([0, height])
        .range([0, height]);

    // d3 treemap layout, projected cost is used for cell value calculation
    var treemap = d3.layout.treemap()
        .children(function(d, depth) { return depth ? null : d._children; })
        .value(function (d) { return d.projected_cost; })
        .sort(function(a, b) { return a.projected_cost - b.projected_cost; })
        .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
        .round(false);

    // SVG for the treemap
    var svg = d3.select("#treemap")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.bottom + margin.top)
            .style("margin-left", -margin.left + "px")
            .style("margin.right", -margin.right + "px")
            .style("margin-bottom", -200 + "px") // ----------- some hack here -----------
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .style("shape-rendering", "crispEdges");

    // the navbar that takes care of the navigation
    var navBar = svg.append("g")
        .attr("class", "navBar");

    navBar.append("rect")
        .attr("y", -margin.top)
        .attr("width", width)
        .attr("height", margin.top);

    navBar.append("text")
        .attr("x", 6)
        .attr("y", 6 - margin.top)
        .attr("dy", ".75em");

    // add the title to navbar
    if (opts.title) {
        $("#treemap").prepend("<p class='title'>" + opts.title + "</p>");
    }

    // ------------------------------------- all the calls -------------------------------------------------------------
    initialize(data);
    accumulateVariance(data);
    accumulateProjectedCost(data);
    layout(data);
    console.log(data);
    display(data);
    // ----------------------------------- vis ended -------------------------------------------------------------------

    // ------------------------------------- all the definitions -------------------------------------------------------

    // Create a colour range for the treemap.
    function treemapColour() {
        return d3.scale.linear()
            .domain([minVar, 0, maxVar])
            .interpolate(d3.interpolateRgb)
            .range(['rgb(251,180,174)', 'rgb(238,238,238)', 'rgb(204,235,197)']);
    }

    // create the root DS
    function initialize(root) {
        root.x = root.y = 0;
        root.dx = width;
        root.dy = height;
        root.depth = 0;
    }

    // sum the projected cost for the children
    function accumulateProjectedCost(d) {
        return (d._children = d.values)
            ? d.projected_cost = d.values.reduce(function(p, v) { return p + accumulateProjectedCost(v); }, 0)
            : d.projected_cost;
    }

    // ----------------- help from https://github.com/eskriett/open-data-vis/blob/master/js/treemap.js -----------------
    function accumulateVariance(d) {
        if (d.values) {
            d.cost_variance_dolr = d.values.reduce(function (prev, current) {
                return prev + accumulateVariance(current);
            }, 0);
        }
        minVar = d.cost_variance_dolr < minVar ? d.cost_variance_dolr : minVar;
        maxVar = d.cost_variance_dolr > maxVar ? d.cost_variance_dolr : maxVar;
        return d.cost_variance_dolr;
    }
    // --------------------- help ended --------------------------------------------------------------------------------

    // x,y,width,height for rects for each node
    function layout(d) {
        if (d._children) {
            treemap.nodes({_children: d._children});
            d._children.forEach(function(c) {
                c.x = d.x + c.x * d.dx;
                c.y = d.y + c.y * d.dy;
                c.dx *= d.dx;
                c.dy *= d.dy;
                c.parent = d;
                layout(c);
            });
        }
    }

    function display(d) {

        // configure the navbar
        navBar
            .datum(d.parent)
            .on("click", transition)
            .select("text")
            .text(navName(d));

        var g1 = svg.insert("g", ".navBar")
            .datum(d);
            // .attr("class", "depth");

        // for each child greate a group
        var g = g1.selectAll("g")
            .data(d._children)
            .enter().append("g");

        // for each node that has children transition on click
        g.filter(function(d) { return d._children; })
            .classed("children", true)
            .on("click", transition);

        // create the children for the treemap
        var children = g.selectAll(".child")
            .data(function(d) { return d._children || [d]; })
            .enter().append("g");

        // create the parent node
        g.append("rect")
            .attr("class", "child")
            .call(rect)
            .append("title")
            .text(function(d) { return d.key ; });

        // create the labels
        g.append("text")
            .attr("class", "ptext")
            .attr("dy", ".75em")
            .call(text);

        function transition(d) {
            if (transitioning || !d) return;
            transitioning = true;

            var g2 = display(d),
                t1 = g1.transition().duration(750),
                t2 = g2.transition().duration(750);

            // Update the domain only after entering new elements.
            x.domain([d.x, d.x + d.dx]);
            y.domain([d.y, d.y + d.dy]);

            // Enable anti-aliasing during the transition.
            svg.style("shape-rendering", null);

            // Draw child nodes on top of parent nodes.
            svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

            // Fade-in entering text.
            g2.selectAll("text").style("fill-opacity", 0);

            // Transition to the new view.
            t1.selectAll(".ptext").call(text).style("fill-opacity", 0);
            t1.selectAll(".ctext").call(text).style("fill-opacity", 0);
            t2.selectAll(".ptext").call(text).style("fill-opacity", 1);
            t2.selectAll(".ctext").call(text).style("fill-opacity", 1);
            t1.selectAll("rect").call(rect);
            t2.selectAll("rect").call(rect);

            // Remove the old node when the transition is finished.
            t1.remove().each("end", function() {
                svg.style("shape-rendering", "crispEdges");
                transitioning = false;
            });
        }

        return g;
    }

    // --------- help from https://github.com/eskriett/open-data-vis/blob/master/js/treemap.js -------------------------

    function text(text) {
        text.attr("x", function(d) { return x(d.x) + 6; })
            .attr("y", function(d) { return y(d.y) + 6; });

        text.each(function (d) {
            var textElement = d3.select(this),
                width = x(d.x + d.dx) - x(d.x); // The width of the rect

            var str = d.key || d.project_name,
                lines = createLines(str, width / 7);

            // For each line append a new tspan to the current text Element
            textElement.text(null)
                .selectAll("tspan")
                .data(lines)
                .enter().append("tspan")
                .text(function (l) { return l.line; })
                .attr("x", x(d.x) + 6)
                .attr("y", function (l) { return (y(d.y) + 6) + l.lineNum * 12; })
                .attr("dy", "0.75em");
        });

        text.style("opacity", displayText);
    }

    function displayText(d) {
        var box = this.getBBox(),
            rectWidth = (x(d.x + d.dx) - x(d.x)) - 10,
            rectHeight = (y(d.y + d.dy) - y(d.y)) - 10;
        return (box.width <= rectWidth && box.height <= rectHeight) ? 1 : 0;
    }

    function createLines(str, width) {
        var words = str.split(' '),
            word,
            lines = [],
            current = '',
            lineNum = 0;

        // Loop through each word and try fit it onto current line
        while (word = words.shift()) {
            if (current.length + word.length + 1 < width) {
                current += current === '' ? word : ' ' + word;
            } else {
                if (current === '') { current = word; }

                lines.push({ line: current, lineNum: lineNum });
                lineNum++;
                current = word;
            }
        }
        // Add the last line if it isn't blank
        if (current !== '') {
            lines.push({ line: current, lineNum: lineNum });
        }

        return lines;
    }

    // --------------------- help ended --------------------------------------------------------------------------------

    function rect(rect) {
        rect.attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) { return y(d.y); })
            .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
            .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); })
            // .style("fill", function(d) { return color(d.key); }); // -------------- coloring on grouping ----------
            .style("fill", function (d) { return treemapColour()(d.cost_variance_dolr); });
    }

    function navName(d) {
        return d.parent
            ? navName(d.parent) + " > " + d.key + " (" + formatNumber(d.projected_cost) + ")"
            : d.key + " (" + formatNumber(d.projected_cost) + ")";
    }

}

var nested;

d3.csv("data/odi-cw-1.csv")
    .row(function (d) {
        return {
            agency_code : +d["Agency Code"],
            agency_name : d["Agency Name"],

            project_id : +d["Project ID"],
            project_name : d["Project Name"],
            project_description : d["Project Description"],

            uniq_investment_id : d["Unique Investment Identifier"],
            investment_title : d["Investment Title"],

            planned_cost_dolr : +d["Planned Cost ($ M)"],
            projected_cost : +d["Projected/Actual Cost ($ M)"],
            cost_variance_dolr : +d["Planned Cost ($ M)"] - +d["Projected/Actual Cost ($ M)"],//+d["Cost Variance ($ M)"],
            cost_variance_perc : (+d["Planned Cost ($ M)"] - +d["Projected/Actual Cost ($ M)"])/+d["Planned Cost ($ M)"],//+d["Cost Variance (%)"],
            lifecycle_cost_dolr : +d["Lifecycle Cost ($M)"],

            start_date : new Date(d["Start Date"]),
            completion_date : new Date(d["Completion Date (B1)"]),
            schedule_variance_days : +d["Schedule Variance (in days)"],
            schedule_variance_perc : +d["Schedule Variance (%)"],
            planned_project_completion_date : new Date(d["Planned Project Completion Date (B2)"]),
            actual_project_completion_date : new Date(d["Projected/Actual Project Completion Date (B2)"]),
            updated_datetime : new Date(d["Updated DateTime"])
        }
    })
    .get(function (err, data) {
        nested = d3.nest()
            .key(function (d) { return d.agency_name; })
            .key(function (d) { return d.investment_title; })
            .entries(data);

        main({title: "US Gov Spending"}, {key: "US", values: nested});
    });

window.addEventListener("resize", function () {
    $("#treemap").empty();
    main({title: "US Gov Spending"}, {key: "US", values: nested});
});