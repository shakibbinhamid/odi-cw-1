/**
 * Created by shakibbinhamid on 22/02/17.
 */
console.log("You're on visualisation 1");

window.addEventListener('message', function(e) {
    var opts = e.data.opts,
        data = e.data.data;

    return main(opts, data);
});

var defaults = {
    margin: {top: 24, right: 0, bottom: 0, left: 0},
    rootname: "TOP",
    format: ",d",
    title: "",
    width: 960,
    height: 500
};

function main(o, data) {
    var root,
        opts = $.extend(true, {}, defaults, o),
        // formatNumber = d3.format(opts.format),
        rname = opts.rootname,
        margin = opts.margin;
        theight = 36 + 16;

    $('#chart').width(opts.width).height(opts.height);
    var width = opts.width - margin.left - margin.right,
        height = opts.height - margin.top - margin.bottom - theight;

    if (data instanceof Array) {
        root = { key: rname, values: data };
    } else {
        root = data;
    }

    initialize(root);
    accumulate(root);

    console.log(root);
    console.log(opts);

    function initialize(root) {
        root.x = root.y = 0;
        root.dx = width;
        root.dy = height;
        root.depth = 0;
    }

    // Aggregate the values for internal nodes. This is normally done by the
    // treemap layout, but not here because of our custom implementation.
    // We also take a snapshot of the original children (_children) to avoid
    // the children being overwritten when when layout is computed.
    function accumulate(d) {
        return (d._children = d.values)
            ? d.value = d.values.reduce(function(p, v) { return p + accumulate(v); }, 0)
            : d.value;
    }
}

d3.csv("data/projects.csv")
    .row(function (d) {
        return {
            agency_code : +d["Agency Code"],
            agency_name : d["Agency Name"],

            project_id : +d["Project ID"],
            project_name : d["Project Name"],
            project_description : d["Project Description"],

            uniq_investment_id : d["Unique Investment Identifier"],
            investment_title : d["Investment Title"],

            planned_cost_dolr : +d["Planned Cost ($M)"],
            actual_cost : +d["Projected/Actual Cost ($M)"],
            cost_variance_dolr : +d["Cost Variance ($M)"],
            cost_variance_perc : +d["Cost Variance (%)"],
            lifecycle_cost_dolr : +d["Lifecycle Cost ($M)"],

            start_date : new Date(d["Start Date"]),
            completion_date : new Date(d["Completion Date (B1)"]),
            schedule_variance_days : +d["Schedule Variance (days)"],
            schedule_variance_perc : +d["Schedule Variance (%)"],
            planned_project_completion_date : new Date(d["Planned Project Completion Date (B2)"]),
            actual_project_completion_date : new Date(d["Projected/Actual Project Completion Date (B2)"]),
            updated_datetime : new Date(d["Updated"])
        }
    })
    .get(function (err, data) {
        var nested = d3.nest()
            .key(function (d) { return d.agency_name; })
            .key(function (d) { return d.investment_title; })
            .entries(data);

        main({title: "US Gov Spending"}, {key: "US", values: nested});
    });