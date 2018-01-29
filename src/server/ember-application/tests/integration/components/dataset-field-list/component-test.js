import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';
import { run } from '@ember/runloop';

moduleForComponent('dataset-field-list', 'Integration | Component | dataset field list', {
  integration: true
});

let model = EmberObject.create({
  dataset: {
    name: 'dataset-name',
    numDocs: '1',
    size: '10'
  },
  fieldList: [{
    name: 'test-field',
    type: 'string',
    included: true
  }],
  file: {},
  submitDataset: function () { return 1; },
  resetList: () => { }
});

test('should render the component', function (assert) {
  this.set('model', model);
  this.render(hbs`{{ dataset-field-list
    file=model.file
    dataset=model.dataset
    fieldList=model.fieldList
    resetList=model.resetList
    submitDataset=model.submitDataset
  }}`);
  assert.equal(this.$('#dataset-name').val(), 'dataset-name', 'Dataset Name: dataset-name');
  assert.equal(this.$('.stats').text().trim(), '1 documents, 10 bytes', 'Stats: 1 documents, 10 bytes');
  assert.equal(this.$('tbody tr').length, 1, 'Table must have only one row');
});

test('should delete model', function (assert) {
  let self = this;
  model.set('resetList', () => { self.set('model', null); });
  this.set('model', model);
  this.render(hbs`{{ dataset-field-list
    file=model.file
    dataset=model.dataset
    fieldList=model.fieldList
    resetList=model.resetList
    submitDataset=model.submitDataset
  }}`);
  assert.notEqual(this.get('model'), null, 'Model must not be null');
  run(() => { document.querySelector('.btn.btn-primary').click(); });
  // assert.equal(this.get('model'), null, 'Model is deleted');
});

