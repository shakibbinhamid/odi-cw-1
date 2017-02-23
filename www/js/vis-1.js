/**
 * Created by shakibbinhamid on 22/02/17.
 */
// console.log("You're on visualisation 1");

// window.addEventListener('message', function(e) {
//     var opts = e.data.opts,
//         data = e.data.data;
//
//     return main(opts, data);
// });

// Add a truncate function to the string object
String.prototype.trunc = function(n){
    return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
};

var defaults = {
    margin: {top: 24, right: 0, bottom: 0, left: 0},
    rootname: "TOP",
    format: ".2f",
    title: "",
    width: 1000,
    height: 650
};

function main(o, data) {
    var root,
        opts = $.extend(true, {}, defaults, o),
        formatNumber = d3.format(opts.format),
        rname = opts.rootname,
        margin = opts.margin;
        theight = 36 + 16;

    // specify the margins
    var width = $('#chart').width() - margin.left - margin.right,
        height = 9/16*$('#chart').width() - margin.top - margin.bottom - theight,
        transitioning;

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
    var svg = d3.select("#chart")
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
        $("#chart").prepend("<p class='title'>" + opts.title + "</p>");
    }

    if (data instanceof Array) {
        root = { key: rname, values: data };
    } else {
        root = data;
    }

    initialize(root);
    accumulateProjectedCost(root);
    layout(root);
    console.log(root);
    display(root);

    // if (window.parent !== window) {
    //     var myheight = document.documentElement.scrollHeight || document.body.scrollHeight;
    //     window.parent.postMessage({height: myheight}, '*');
    // }

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

        // children.append("text")
        //     .attr("class", "ctext")
        //     .text(function(d) { return d.key; })
        //     .call(text2);

        // g.append("rect")
        //     .attr("class", "parent")
        //     .call(rect);

        var t = g.append("text")
            .attr("class", "ptext")
            .attr("dy", ".75em");

        t.append("tspan")
            .text(function(d) { return d.key; });
        t.append("tspan")
            .attr("dy", "1.0em")
            .text(function(d) { return formatNumber(d.projected_cost); });
        t.call(text);

        g.selectAll("rect")
            .style("fill", function(d) { return color(d.key); });

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
            t1.selectAll(".ctext").call(text2).style("fill-opacity", 0);
            t2.selectAll(".ptext").call(text).style("fill-opacity", 1);
            t2.selectAll(".ctext").call(text2).style("fill-opacity", 1);
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

    function text(text) {
        text.selectAll("tspan")
            .attr("x", function(d) { return x(d.x) + 6; });
        text.attr("x", function(d) { return x(d.x) + 6; })
            .attr("y", function(d) { return y(d.y) + 6; })
            .style("opacity", function(d) { return this.getComputedTextLength() < x(d.x + d.dx) - x(d.x) ? 1 : 0; });
    }

    function text2(text) {
        text.attr("x", function(d) { return x(d.x + d.dx) - this.getComputedTextLength() - 6; })
            .attr("y", function(d) { return y(d.y + d.dy) - 6; })
            .style("opacity", function(d) { return this.getComputedTextLength() < x(d.x + d.dx) - x(d.x) ? 1 : 0; });
    }

    function rect(rect) {
        rect.attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) { return y(d.y); })
            .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
            .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
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
            cost_variance_dolr : +d["Cost Variance ($ M)"],
            cost_variance_perc : +d["Cost Variance (%)"],
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
    $("#chart").empty();
    main({title: "US Gov Spending"}, {key: "US", values: nested});
});