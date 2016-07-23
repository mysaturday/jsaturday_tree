var debug = require('debug')('mysaturday_tree');

var DEFAULT_ORPHAN_ID = 'ORPHANS';


module.exports = function Tree(settings) {
  var self = this;

  if (!settings)
    settings = {};

  settings.orphanParentId = settings.orphanParentId || DEFAULT_ORPHAN_ID;

  var cache = {};

  function cleanCache() {
    cache = {
      up: {},
      down: {},
    };
  }

  if (settings.TTL) {
    setInterval(function() {
      cleanCache();
    }, settings.TTL * 1000);
  }

  var nodes = {};
  this.initialized = false;

  this.addNode = function(node) {
    if (!node._id)
      throw new Error('Missing _id for node ' + node);

    if (node._children)
      throw new Error('_children field is not allowed.');

    if (!node._parent && node._id !== 'ROOT'){
      debug('warning', 'Node ' + node._id + ' will be connected to orphan node');
      node._parent = settings.orphanParentId;
    }

    if (node._parent === node._id)
      throw new Error('Node _id can not be equal to _parent');


    if (node._id === 'ROOT') {
      delete node._parent;
    }

    this.initialized = false;

    nodes[node._id] = node;
  };

  this.removeNode = function(nodeId, newParentForChildren){
    if (!nodeId)
      throw new Error('Missing nodeId');

    if (!nodes[nodeId])
      throw new Error('Node ' + nodeId + ' not found!');

    // In case of children
    if(nodes[nodeId]._children){
      var i;
      // If newParentForChildren is defined, move all children to
      // this node
      if(!newParentForChildren || !nodes[newParentForChildren]){
        debug('warning', 'Children of node ' + nodeId + ' will be connected to orphan node');
        newParentForChildren = settings.orphanParentId;
      }
      if(newParentForChildren && nodes[newParentForChildren]){
        for(i = 0; i < nodes[nodeId]._children.length; i++){
          var childId = nodes[nodeId]._children[i];
          nodes[childId]._parent = newParentForChildren;
        }
      }
      else{
        throw new Error('No orphane node or new parent found!')
      }
    }
    
    delete nodes[nodeId];

    cleanCache();
    this.initialized = false;
  }

  this.getNodeCopy = function(nodeId){
    if (!nodeId)
      throw new Error('Missing nodeId');

    if (!nodes[nodeId])
      throw new Error('Node ' + nodeId + ' not found!');

    return clone(nodes[nodeId]);
  }

  this.updateNode = function(nodeObject){
    if (!nodeObject)
      throw new Error('Missing nodeObject');

    if (!nodeObject._id)
      throw new Error('Missing nodeObject._id');    

    if (!nodes[ nodeObject._id ])
      throw new Error('Node ' + nodeObject._id + ' not found, I can not update!');

    var newNode = clone(nodeObject);
    nodes[newNode._id] = newNode;
    
    cleanCache();
    this.initialized = false;

  }

  this.initialize = function() {

    // Reset cache
    cleanCache();

    function _addChildren(nodeId, idParent) {
      if (!nodes[nodeId] || !nodes[idParent]) {
        return;
      }
      var parent = nodes[idParent];
      if (!parent._children) {
        parent._children = [];
      }
      parent._children.push(nodeId);
    }

    // Create special nodes
    if(!nodes.ROOT)
      nodes.ROOT = {_id: 'ROOT'};

    if(settings.orphanParentId){
      if(!nodes[settings.orphanParentId]){
        nodes[settings.orphanParentId] = {
          _id: settings.orphanParentId,
        };
      }
      // Be sure that ORPHAN nod is connected to ROOT
      nodes[settings.orphanParentId]._parent = 'ROOT';
    }

    // Compute children
    var id;

    for (id in nodes)
      delete nodes[id]._children;

    for (id in nodes) {
      var node = nodes[id];
      if (node._parent)
        _addChildren(id, node._parent);
    }

    self.initialized = true;

  };

  this.getAll = function() {
    if (!self.initialized)
      self.initialize();

    return nodes;
  };

  this.getUp = function(nodeId) {
    if (!nodeId)
      throw new Error('Missing nodeId');

    if (!nodes[nodeId])
      throw new Error('Node ' + nodeId + ' not found!');

    if (cache.up[nodeId]) {
      console.log("CACHED!");
      return cache.up[nodeId];
    }

    var up = [];

    function _getUp(id) {
      up.push(id);
      var parentId = nodes[id]._parent || null;
      if (parentId)
        _getUp(parentId);
    }

    _getUp(nodeId);

    if (settings.TTL)
      cache.up[nodeId] = up;

    return up;
  };

  this.getDown = function(nodeId) {
    if (!nodeId)
      throw new Error('Missing nodeId');

    if (!nodes[nodeId])
      throw new Error('Node ' + nodeId + ' not found!');

    if (cache.down[nodeId]) {
      console.log("CACHED!");
      return cache.down[nodeId];
    }

    var down = [];

    function _getDown(id) {
      down.push(id);

      if (!nodes[id]._children)
        return;

      for (var i = 0; i < nodes[id]._children.length; i++) {
        _getDown(nodes[id]._children[i]);
      }
    }

    _getDown(nodeId);

    if (settings.TTL)
      cache.down[nodeId] = down;

    return down;
  };

};



function clone(obj){
  return JSON.parse(JSON.stringify( obj ));
}