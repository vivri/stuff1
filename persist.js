
// ye cache
// TODO abstract me, and persist me!
var cache = {
  docs: {},
  tags: {
    by_doc: {},
    by_prov: {}
  },
  provisions: {}
}

// TODO from config or dynamic api
var provision_types = {
  'CHANGE_OF_CONTROL': true,
  'TYPE2': true,
  'TYPE3': true
  // ...
}

// such good design!
var BIG_GLOBAL_ID_GEN = 0;

/**
* Fetches a document, and potentially its tags and provisions iff 2nd and 3rd args are true
*
* returns { document: <string>, tags: [<tag-type>,...], provisions: [<provision-type>, ...]}
* note that: tags: .., provisions: .. will be [] iff 2nd and 3rd arg are false (or partially so)
*/
module.exports.getDoc = function (document_id, with_tags, with_provisions) {
  var ret = { document: cache[docs][document_id], tags: [], provisions: [] }

  if (with_tags)
    ret.tags = module.exports.getTagsByDoc (document_id)

  if (with_provisions)
    ret.provisions = module.exports.getProvisionsByDoc (document_id)

}


module.exports.getTagsByDoc = function (document_id) {
  return tagsBy ('by_doc', document_id)
}

module.exports.getTagsByProvision = function (provision_id) {
  return tagsBy ('by_prov', provision_id)
}

function tagsBy (context, id) {
  return cache.tags[context][id] || []
}

module.exports.getProvisionsByDoc = function (document_id) {
  return cache.provisions[document_id] || []
}

/**
* saves the tag in the correct cache slot.
* throws on bad parent type, or if parent not found
*
* tag format: {parent_type: [document|provision], parent_id: <int>, tag: <string>}
*/
module.exports.saveTag = function (parent_type, parent_id, text) {
  var tag_cache;

  switch (parent_type.toLowerCase()) {    
    case 'document':
      tag_cache = cache.tags.by_doc
      break
    case 'provision':
      tag_cache = cache.tags.by_prov
      break
    default:
      throw new Error ('Unknown parent type: ' + parent_type)
  }

  if (!findParent (parent_type, parent_id))
    throw new Error ('Parent does not exist')

  var slot = tag_cache[parent_id]
  if (!slot) {
    tag_cache[parent_id] = []
    slot = tag_cache[parent_id]
  }

  slot.push ({parent_type: parent_type, parent_id: parent_id, tag: text})
}


/**
* Saves the provision for a document.
*
* provision_type: in finite set.
* idx_[start|end]: [0, doc.length) 
*
* throws on doc not found, bad provision type, invalid indices.
*/
module.exports.saveProvision = function (document_id, provision_type, idx_start, idx_end) {
  if (!provision_types[provision_type])
    throw new Error ('Invalid provision type: ' + provision_type)

  var parent = findParent ('document', document_id)
  if (!parent)
    throw new Error ('Parent not found')

  if (idx_start < 0 || idx_end > parent.text.length || idx_start >= idx_end)
    throw new Error ('Invalid document text indexing')

  var slot = cache.provisions[document_id]
  if (!slot) {
    cache.provisions[document_id] = []
    slot = cache.provisions[document_id]
  }

  // TODO check provision collisions: {doc_id, provision_type, idx_start, idx_end} should be unique!
  slot.push ({id: BIG_GLOBAL_ID_GEN++, parent_id: document_id, type: provision_type, idx_start: idx_start, idx_end: idx_end})
}

// returns the parent. throws iff bad type. falsy if nonexistent
function findParent (parent_type, parent_id) {
  var parent_cache;
  switch (parent_type.toLowerCase()) {    
    case 'document':
      parent_cache = cache.documents
      tag_cache = cache.tags.by_doc
      break
    case 'provision':
      parent_cache = cache.provisions
      tag_cache = cache.tags.by_prov
      break
    default:
      throw new Error ('Unknown parent type: ' + parent_type)
  }

  return parent_cache[parent_id]
}

/**
* saves the document in the form of: {id: <int>, text: <string> }
*/
module.exports.saveDocument = function (text) {
  cache.documents.push ({id: BIG_GLOBAL_ID_GEN++, text: text})
}
