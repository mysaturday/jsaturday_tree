# jsaturday_tree

## Description
Simple in-memory tree structure to represent hierarchical data. 

The tree is defined by:
- *n* nodes; each node is an Object contains arbitrary data, and two special fields: **_id** (unique node id) and **_parent** (id of parent node). If no parent node is given, it is automatically assigned
- *One* root node, with _id = 'ROOT'
- *One* orphan node, (default _id = 'ORPHANS') connected under 'ROOT' node.
- *One* parent for each node, or *zero* parents (in this case node will be connected to orphan node).

## Installation

```sh
$ npm i jsaturday_tree
```

## Test

```sh
$ npm test
```

## Usage
```js
// Require Tree object
var Tree = require('jsaturday_tree');

//-----------------------------------------------------------------
// Options
//-----------------------------------------------------------------
var options = {
    // How long (sec) data structure will keep as computed in the memory
    TTL: 60, // default = 0 => no cache
    
    // Parent nodes for nodes without parent, by default it is
    // 'ORPHANS', connected to 'ROOT'
    orphanParentId: 'MyORPHAN' // default = ORPHANS
};

//-----------------------------------------------------------------
// Constructor
//-----------------------------------------------------------------
var roles = new Tree(options);

//-----------------------------------------------------------------
// Add nodes
//-----------------------------------------------------------------
// (for each added node cache is automatically flushed)
// Note: 'ROOT' node and orphan node will be automatically created before
// initialization, if they was not provided by user.
roles.addNode({
    _id: 'NODE1',
    _parent: 'ROOT',
    attribute1: ...
});
roles.addNode({
    _id: 'NODE2',
    _parent: 'NODE1',
    attribute1: ... ,
    attribute2: ... ,
});

// This is an ORPHAN node
roles.addNode({
    _id: 'NODE3'
});

roles.addNode({
    _id: 'NODE4',
    _parent: 'ROOT',
});

roles.addNode({
    _id: 'NODE5',
    _parent: 'NODE4',
    value: 1
});

//-----------------------------------------------------------------
// Initialize data structure
//-----------------------------------------------------------------
// It resets cache and computes children. This method is
// called automatically if new node was added / removed, so probably you
// will never use.
roles.initialize();

//-----------------------------------------------------------------
// Get data structure.
//-----------------------------------------------------------------
// Returns a COPY node objects, with _children attribute computed
var all = roles.getAll();

//-----------------------------------------------------------------
// Up and Down chains
//-----------------------------------------------------------------
// Return array of node ids from required nodeId to ROOT
var node1UpIds = roles.getUp('NODE1');      // => ['NODE1', 'ROOT']
var node3UpIds = roles.getUp('NODE3');      // => ['NODE3', 'MyORPHAN']

// Return array of node ids from required nodeId to leaves
var node1DownIds = roles.getDown('NODE1');  // => ['NODE1', 'NODE2']

//-----------------------------------------------------------------
// Removing a node
//-----------------------------------------------------------------
// Removing a node and set a new parent for all the children
roles.removeNode('NODE1', 'ROOT');
var node2UpIdNow = roles.getUp('NODE2');      // => ['NODE2', 'ROOT']

// Removing a node and move all children to orphan node
roles.removeNode('NODE4');
var node5UpIdNow = roles.getUp('NODE5');      // => ['NODE5', 'MyORPHAN']

//-----------------------------------------------------------------
// Get node content (it will pass A COPY!)
//-----------------------------------------------------------------
var node5CloneA = roles.getNodeCopy(NODE5);
// node5CloneA = {_id: "NODE5", _parent: "MyORPHAN", value: 1}
node5CloneA.value = 2;
// node5Clone = {_id: "NODE5", _pare nt: "MyORPHAN", value: 2}
var node5CloneB = roles.getNodeCopy(NODE5);
// node5CloneB = {_id: "NODE5", _parent: "MyORPHAN", value: 1}

//-----------------------------------------------------------------
// Update node content (it will save a COPY of passed object!)
//-----------------------------------------------------------------
roles.updateNode(node5CloneA);
// Internal NODE5 = {_id: "NODE5", _pare nt: "MyORPHAN", value: 2}
node5CloneA.value = 3;
// Internal NODE5 = {_id: "NODE5", _pare nt: "MyORPHAN", value: 2}

```