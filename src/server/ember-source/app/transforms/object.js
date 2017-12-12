import DS from 'ember-data';

export default DS.Transform.extend({
  deserialize(serialized) {
      return (serialized && Object.keys(serialized).length > 0) ? serialized : null;
  },

  serialize(deserialized) {
    return this.deserialize(deserialized);
  }

});
