import React from 'react';
import PropTypes from 'prop-types';

//semiotic
import { ResponsiveNetworkFrame } from 'semiotic';

//d3
import * as d3Scale from "d3-scale";
import * as d3Array from "d3-array";
import * as d3Interpolate from "d3-interpolate"

//lodash
import _ from 'lodash';

//material ui
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';

//icons
import Comment from '@material-ui/icons/Comment';

//utils 
import { 
    log
  } from '../../utils';
  
const styles = {
  root: {
    flexGrow: 1,
  },
};

// Minimum and maximum fallback sizes for markers
const MIN_MARKER_RADIUS = 1;
const MAX_MARKER_RADIUS = 25;

// unflatten function was obtained from stack overflow link below and modified slightly for use herein
// https://stackoverflow.com/questions/18017869/build-tree-array-from-flat-array-in-javascript
function unflatten ( array, parent, seed, tree ) {
    tree = typeof tree !== 'undefined' ? tree : [];
    parent = typeof parent !== 'undefined' ? parent : { id: 0 };

    var children = _.filter( array, function(child){ return child.name == parent.child; });

    if( !_.isEmpty( children )  ){
        if( parent.child == seed ) {
            tree = Object.assign({}, parent, {"name": seed, "children": children});
        }
        else {
            parent['children'] = children;
        }
        _.each( children, (child) => { unflatten( array, child ); } );
    }  
    return tree;
}


// hierarchyDataPreped
// (the original code contained a bug which would result
// in worldDataMissing always being an empty array)
function buildhierarchyDataPreped(hierarchyData, ConfigParentField, ConfigChildField, ConfigColorField, ConfigValueField) {
    const hierarchyDataPreped = _.cloneDeep(hierarchyData);

    //now that we are in here we can rename fields as we need to in order avoid errors
    _.forEach(hierarchyDataPreped, (a) => {
        a['ConfigParentField'] = ConfigParentField;
        a['ConfigChildField'] = ConfigChildField;
        a['ConfigColorField'] = ConfigColorField;
        a['ConfigValueField'] = ConfigValueField;

        if (ConfigParentField !== "name") {
            a['name'] = a[ConfigParentField];
            delete a[ConfigParentField];    
        }

        if (ConfigChildField !== "child") {
            a['child'] = a[ConfigChildField];
            delete a[ConfigChildField];
        }
        
        if (ConfigColorField !== "colorHex") {
            a['colorHex'] = a[ConfigColorField];
            delete a[ConfigColorField];
        }

        if (ConfigValueField !== "valueMetric") {
            a['valueMetric'] = parseFloat(a[ConfigValueField]);
            delete a[ConfigValueField];
        }
    });

    log('in semiotic component mount', hierarchyDataPreped, hierarchyData);

    return hierarchyDataPreped;
}


//find the root node in the data set provided
//need to handle if there are more than one of these!!
function getRoot(hierarchyDataPreped) {
    if (!hierarchyDataPreped) {
        return () => {};
    }

    log('in get root', hierarchyDataPreped);
    let root = _.filter(hierarchyDataPreped, (o) => { return o.name == null; });
    log('root array', root[0].child, root);

    return root;
}

function buildEdgeData (hierarchyDataPreped, root) {
    if (!hierarchyDataPreped) {
        return () => {};
    }
  
    log('edgeData', hierarchyDataPreped);
    let edgeData = unflatten(hierarchyDataPreped, { ...root[0] }, root[0].child);
    log('edgeData', edgeData);

    return edgeData;
}

function buildNodeData (hierarchyDataPreped) {
    if (!hierarchyDataPreped) {
        return () => {};
    }

    let nodeData = _.uniqBy(hierarchyDataPreped, 'child'); 
    log('nodeData', nodeData);

    return nodeData;
}

function buildNodeSizeScale(nodeData, markerMinRadius, markerMaxRadius) {
    if (!nodeData) {
      return () => {};
    }
    function remapper(d) {
      return parseFloat(d["valueMetric"] || 0) || 0;
    }
    return d3Scale.scaleSqrt()
      .domain(d3Array.extent(nodeData, remapper))
      .range([
        markerMinRadius*1 || MIN_MARKER_RADIUS*1,
        markerMaxRadius*1 || MAX_MARKER_RADIUS*1,
      ]);
}

function buildNodeColorScale(nodeData, nodeFillColor) {
    if (!nodeData) {
      return () => {};
    }
    function remapper(d) {
      return parseFloat(d["valueMetric"] || 0) || 0;
    }
    return d3Scale.scaleLinear()
      .domain(d3Array.extent(nodeData, remapper))
      .range(_.split(nodeFillColor,','))
    ;
}

// Create a memoized version of each call which will (hopefully) cache the calls.
// NOTE: passing the whole "props" to these functions will make them sub-optimal as
// the memoize depends on passing an equal object to get the cached result.
let memoized = {
    buildhierarchyDataPreped: _.memoize(buildhierarchyDataPreped),
    getRoot: _.memoize(getRoot),
    buildNodeData: _.memoize(buildNodeData),
    buildEdgeData: _.memoize(buildEdgeData),
    buildNodeSizeScale: _.memoize(buildNodeSizeScale),
    buildNodeColorScale: _.memoize(buildNodeColorScale),
};

class SemioticHierarchy extends React.Component {
    constructor (props) {
      super(props);
      this.state = {
        root: "",
        edgeData: [],
        nodeData: [],
        nodeSizeScale: undefined,
        nodeColorScale: undefined, 
        icons: false
      }  

      // icon stuff
      this.showIcons = this.showIcons.bind(this);
      this.hideIcons = this.hideIcons.bind(this);
      this.configAnnotations = this.configAnnotations.bind(this);
    }

    showIcons() {
        this.setState({
          icons: true
        });
      }
  
      hideIcons() {
        this.setState({
          icons: false
        });
      }

      configAnnotations() {
          console.log('configuartion of annotations');
      }

    // Previously in componentDidMount, this prepares our data if possible,
    // and returns a dict that corresponds to the old componentDidMount() state changes
    preprocessData() {
        const {
            hierarchyData,
            tableauSettings,
        } = this.props;

        let hierarchyDataPreped = memoized.buildhierarchyDataPreped(
            hierarchyData, 
            tableauSettings.ConfigParentField, 
            tableauSettings.ConfigChildField, 
            tableauSettings.ConfigColorField, 
            tableauSettings.ConfigValueField
        );

        let root = memoized.getRoot(hierarchyDataPreped);
        let nodeData = memoized.buildNodeData(hierarchyDataPreped);
        let edgeData = memoized.buildEdgeData(hierarchyDataPreped, root);

        let nodeSizeScale = memoized.buildNodeSizeScale(nodeData, tableauSettings.markerMinRadius, tableauSettings.markerMaxRadius);
        let nodeColorScale = memoized.buildNodeColorScale(nodeData, tableauSettings.nodeFillColor);

        return ({
            hierarchyDataPreped: hierarchyDataPreped, 
            nodeData: nodeData,
            edgeData: edgeData,
            nodeSizeScale: nodeSizeScale, 
            nodeColorScale: nodeColorScale,
        });
    }

    componentDidMount() {
        log('component mounted');
    }
  
    render() {
        //log('semitoic component', this.props);
        const {
            height,
            width,
            nodeRender,
            nodeFillColor, 
            nodeFillOpacity, 
            nodeStrokeColor, 
            nodeStrokeOpacity,
            nodeSize,
            edgeRender,
            edgeType,
            edgeFillColor, 
            edgeFillOpacity, 
            edgeStrokeColor, 
            edgeStrokeOpacity,
            hoverAnnotation,
            networkType,
            networkProjection, 
            tableauSettings,
        } = this.props;
        
        // pull in memoized stuff for use in render function
        let {
            hierarchyDataPreped, 
            nodeData,
            edgeData,
            nodeSizeScale, 
            nodeColorScale,
        } = this.preprocessData();

        let iconJSX;

        log('hierarchy Data in sub component', [width, height], hierarchyDataPreped, edgeData);

        // check icons
        if ( this.state.icons ) {
            iconJSX =
              <div style={{position: "absolute", zIndex: 9999}} >
                <Grid container justify="center">
                  <Grid item xs={6}>
                    <Tooltip title={`Edit Annotations`} placement="right">
                      <IconButton onClick={this.configAnnotations} >
                          <Comment
                            color="action"
                            // color={this.state.enableDrag ? "secondary" : "action"}
                            //style={{ fontSize: 15 }}
                          />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              </div>
            }
    
        // create the custom tooltip for semiotic
        const popOver = (d) => {
            // log('in tooltip', d);
            if ( d.parent && tableauSettings.ConfigValueField !== "None") {
                return (
                    <Paper style={{'padding': '5px'}}>
                        <Typography> {tableauSettings.ConfigParentField}: {d.parent.child} </Typography>
                        <Typography> {tableauSettings.ConfigChildField}: {d.child} </Typography>
                        <Typography> {tableauSettings.ConfigValueField}: {d.valueMetric} </Typography>
                    </Paper>
                );
            } else if ( d.parent ) {
                return (
                    <Paper style={{'padding': '5px'}}>
                        <Typography> {tableauSettings.ConfigParentField}: {d.parent.child} </Typography>
                        <Typography> {tableauSettings.ConfigChildField}: {d.child} </Typography>
                    </Paper>
                );
            } else if (tableauSettings.ConfigValueField !== "None") {
                return (
                    <Paper style={{'padding': '5px'}}>
                        <Typography> {tableauSettings.ConfigChildField}: {d.child} </Typography>
                        <Typography> {tableauSettings.ConfigValueField}: {d.valueMetric} </Typography>
                    </Paper>
                );
            } else {
                return (
                    <Paper style={{'padding': '5px'}}>
                        <Typography> {tableauSettings.ConfigChildField}: {d.child} </Typography>
                    </Paper>
                );
            }
        }

       return (
           console.log('render-return', height, width),
            <div 
                className="semiotic-hierarchy" 
                style={{ padding: '1%', height: height, width: width, float: 'none', margin: '0 auto' }}
                onMouseEnter={this.showIcons}
                onMouseLeave={this.hideIcons}
                >
                {iconJSX}
                <ResponsiveNetworkFrame
                    responsiveWidth
                    responsiveHeight
                    edges={edgeData}
                    nodeIDAccessor={d => d.child}
                    nodeSizeAccessor={
                            tableauSettings.nodeSize === "none" ? undefined
                        :   tableauSettings.ConfigType === "Circlepack" ? undefined 
                        :   tableauSettings.ConfigType === "Treemap" ? undefined
                        :   tableauSettings.ConfigValueField === "None" ? undefined
                        :   d => nodeSizeScale(d.valueMetric || 0)
                    } // this breaks the treemap and circlepack
                    nodeRenderMode={nodeRender}
                    edgeRenderMode={edgeRender}
                    edgeType={edgeType}
                    nodeStyle={(d,i) => ({ 
                        fill: tableauSettings.colorConfig === "solid" ? _.split(this.props.nodeFillColor,',')[0]
                            : tableauSettings.colorConfig === "scale" && tableauSettings.ConfigValueField !== "None" ? nodeColorScale(d.valueMetric || 0)
                            : tableauSettings.colorConfig === "field" && tableauSettings.ConfigColorField !== "None" ? d.colorHex 
                            : _.split(this.props.nodeFillColor,',')[0],
                        fillOpacity: nodeFillOpacity,
                        stroke: tableauSettings.colorConfig === "solid" ? _.split(this.props.strokeFillColor,',')[0]
                            : tableauSettings.colorConfig === "scale" && tableauSettings.ConfigValueField !== "None" ? nodeColorScale(d.valueMetric || 0)
                            : tableauSettings.colorConfig === "field" && tableauSettings.ConfigColorField !== "None" ? d.colorHex 
                            : _.split(this.props.strokeFillColor,',')[0],
                        strokeOpacity: nodeStrokeOpacity
                    })}
                    edgeStyle={(d,i) => ({ 
                        fill: edgeFillColor,
                        fillOpacity: edgeFillOpacity,
                        stroke: d.target.colorHex || "#BDBDBD", 
                        strokeOpacity: edgeStrokeOpacity
                    })}
                    edgeWidthAccessor={d => d.valueMetric || 1}
                    networkType={{
                        type: networkType,
                        projection: networkProjection,
                        nodePadding: 1,
                        forceManyBody: networkType === "force" ? -250 : -50,
                        edgeStrength: networkType === "force" ? 2 : 1,
                        iterations: networkType === "force" ? 500 : 1,
                        padding: networkType === "treemap" ? 3 : networkType === "circlepack" ? 2 : 0,
                        distanceMax: networkType === "force" ? 500 : 1,
                        hierarchySum: d => d.valueMetric || 0
                    }}                

                    //annotations layer which allowers for pseudo highlight
                    // annotations={this.props.highlightOn}
                    annotations={[
                        {
                            dx: (this.state.overridePosition || {})[0] ? this.state.overridePosition[0].dx : 0,
                            dy: (this.state.overridePosition || {})[0] ? this.state.overridePosition[0].dy : 0,
                            editMode: true,
                            onDragEnd: annotationInfo => { 
                                this.setState({
                                    overridePosition: {
                                        ...this.state.overridePosition,
                                        [0]: {
                                            dx: annotationInfo.updatedSettings.dx,
                                            dy: annotationInfo.updatedSettings.dy
                                        }
                                    }
                                });
                                console.log('annotation info', annotationInfo, this.state);

                            },
                            type: "enclose",
                            ids: ["_",
                                  "add",
                                  "and",
                                  "average",
                                  "count",
                                  "distinct",
                                  "div",
                                  "eq",
                                  "fn",
                                  "gt",
                                  "gte",
                                  "iff",
                                  "isa",
                                  "lt",
                                  "lte",
                                  "max",
                                  "min",
                                  "mod",
                                  "mul",
                                  "neq",
                                  "not",
                                  "or",
                                  "orderby",
                                  "range",
                                  "select",
                                  "stddev",
                                  "sub",
                                  "sum",
                                  "update",
                                  "variance",
                                  "where",
                                  "xor"
                                ],
                            color: "#000",
                            label: "these are methods!",
                            strokeWidth: 1,
                            padding: 20
                        }
                    ]}
                    
                    // interactivity
                    hoverAnnotation={hoverAnnotation}
                    tooltipContent={d => popOver(d)}
                    customClickBehavior={(d) => this.props.clickCallBack(d)}
                    customHoverBehavior={(d) => this.props.hoverCallBack(d)}
                />
            </div>
        );
    }
}

// SemioticHierarchy.propTypes = {
//     classes: PropTypes.object.isRequired,
// };
  
export default SemioticHierarchy;
  