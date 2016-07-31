var debug = require('debug')('mysaturday_tree');

var DEFAULT_ORPHAN_ID = 'ORPHANS';


module.exports = function Tree(settings) {
  var self = this;

  if (!settings)
    settings = {};

  settings.orphanParentId = settings.orphanParentId || DEFAULT_ORPHAN_ID;
  settings.TTL = settings.TTL || 0;


  var cache = {};

  function cleanCache() {
    cache = {
      up: {},
      down: {},
      all: [],
    };
  }

  if (settings.TTL) {
    setInterval(function() {
      cleanCache();
    }, settings.TTL * 1000);
  }

  var nodes = {};
  var initialized = false;

  this.addNode = function(node, callback) {
    if (!node._id){
      if(!callback)
        throw new Error('Missing _id for node ' + node);
      return callback(new Error('Missing _id for node ' + node));
    }

    if (node._children){
      if(!callback)
        throw new Error('_children field is not allowed.');
      return callback(new Error('_children field is not allowed.'));
    }

    if (!node._parent && node._id !== 'ROOT'){
      debug('warning', 'Node ' + node._id + ' will be connected to orphan node');
      node._parent = settings.orphanParentId;
    }

    if (node._parent === node._id){
      if(!callback)
        throw new Error('Node _id can not be equal to _parent');
      return callback(new Error('Node _id can not be equal to _parent'));
    }

    if (node._id === 'ROOT') {
      delete node._parent;
    }

    if (nodes[node._id]){
      if(!callback)
        throw new Error('Node exists on the tree');
      return callback(new Error('Node exists on the tree'));
    }

    initialized = false;

    nodes[node._id] = node;

    if(callback && typeof callback === 'function'){
      return callback(null, node);
    }

  };


//  this.removeNode = function(nodeId, newParentForChildren, callback){
  this.removeNode = function(nodeId, arg2, arg3){

    var newParentForChildren = null;
    var callback = null;
    if(arg3 && typeof arg3 === 'function'){
      newParentForChildren = arg2;
      callback = arg3;
    }
    else if(!arg3 && typeof arg2 === 'function'){
      callback = arg2;
    }
    else if(!arg3 && typeof arg2 !== 'function'){
      newParentForChildren = arg2;
    }

    if (!nodeId){
      if(!callback)
        throw new Error('Missing nodeId');
      return callback(new Error('Missing nodeId'));
    }

    if (!nodes[nodeId]){
      if(!callback)
        throw new Error('Node ' + nodeId + ' not found!');
      return callback(new Error('Node ' + nodeId + ' not found!'));
    }

    if (nodeId === 'ROOT'){
      if(!callback)
        throw new Error('Not allowed to remove ROOT node');
      return callback(new Error('Not allowed to remove ROOT node'))
    }

    if (nodeId === settings.orphanParentId){
      if(!callback)
        throw new Error('Not allowed to remove orphanParent node');
      return callback(new Error('Not allowed to remove orphanParent node'));
    }

    this.initialize();

    // In case of children
    if(nodes[nodeId]._children){
      var i;
      // If newParentForChildren is defined, move all children to
      // this node
      if(!newParentForChildren){
        debug('warning', 'Children of node ' + nodeId + ' will be connected to orphan node');
        newParentForChildren = settings.orphanParentId;
      }

      if(!nodes[newParentForChildren]){
        if(!callback)
          throw new Error('newParentForChildren node not found!');
        return callback(new Error('newParentForChildren node not found!'));
      }
      if(newParentForChildren && nodes[newParentForChildren]){
        for(i = 0; i < nodes[nodeId]._children.length; i++){
          var childId = nodes[nodeId]._children[i];
          nodes[childId]._parent = newParentForChildren;
        }
      }
      else{
        if(!callback)
          throw new Error('No orphane node or new parent found!');
        return callback(new Error('No orphane node or new parent found!'));
      }
    }
    
    delete nodes[nodeId];

    this.initialized = false;

    if(callback)
      return callback(null, true);

  }

  this.getNodeCopy = function(nodeId){
    if (!nodeId)
      throw new Error('Missing nodeId');

    if (!nodes[nodeId])
      throw new Error('Node ' + nodeId + ' not found!');

    this.initialize();

    return clone(nodes[nodeId]);
  }

  this.updateNode = function(nodeObject, callback){
    if (!nodeObject){
      if(!callback)
        throw new Error('Missing nodeObject');
      return callback(new Error('Missing nodeObject'));
    }

    if (typeof nodeObject !== 'object'){
      if(!callback)
        throw new Error('Missing nodeObject');    
      return callback(new Error('Missing nodeObject'));
    }

    if (!nodeObject._id){
      if(!callback)
        throw new Error('Missing nodeObject._id');
      return callback(new Error('Missing nodeObject._id'));

    }

    if (!nodes[ nodeObject._id ]){
      if(!callback)
        throw new Error('Node ' + nodeObject._id + ' not found, I can not update!');
      return callback(new Error('Node ' + nodeObject._id + ' not found, I can not update!'));
    }

    if (nodeObject._children){
      if(!callback)
        throw new Error('_children field is not allowed.');
      return callback(new Error('_children field is not allowed.'));
    }

    this.initialize();

    var newNode = clone(nodeObject);

    if (!newNode._parent && newNode._id !== 'ROOT'){
      debug('warning', 'Node ' + newNode._id + ' will be connected to orphan node');
      newNode._parent = settings.orphanParentId;
    }

    nodes[newNode._id] = newNode;

    this.initialized = false;

    if(callback && typeof callback === 'function'){
      return callback(null, nodes[newNode._id]);
    }

  }

  this.initialize = function() {

    if(initialized)
      return true;

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

  this.getAllCopy = function() {
    this.initialize();
    return clone(nodes);
  };

  this.getUp = function(nodeId) {
    if (!nodeId)
      throw new Error('Missing nodeId');

    if (!nodes[nodeId])
      throw new Error('Node ' + nodeId + ' not found!');

    this.initialize();

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

    this.initialize();

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