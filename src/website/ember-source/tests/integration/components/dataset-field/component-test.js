import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';
import { run } from '@ember/runloop';

moduleForComponent('dataset-field', 'Integration | Component | dataset field', {
  integration: true
});

let field = EmberObject.create({
  name: 'test-field',
  type: 'string',
  included: true,
  index: 1
});

test('should display field info row', function (assert) {
  this.set('field', field);
  this.render(hbs`{{ dataset-field name=field.name type=field.type included=field.included index=field.index }}`);
  assert.equal(this.$('#field-name-1').val(), 'test-field', 'Field Name: test-field');
  assert.equal(this.$('#field-type-1').val(), 'string', 'Field Type: string');
  assert.equal(this.$('#field-included-1').is(':checked'), true, 'Field Included: true');
});

test('should change field name value', function (assert) {
  this.set('field', field);
  this.render(hbs`{{ dataset-field name=field.name type=field.type included=field.included index=field.index }}`);
  assert.equal(this.$('#field-name-1').val(), 'test-field', 'Input value: test-field');
  run(() => this.$('#field-name-1').val('new-field'));
  assert.equal(this.$('#field-name-1').val(), 'new-field', 'Input value: new-field');
});

test('should change field included value', function (assert) {
  this.set('field', field);
  this.render(hbs`{{ dataset-field name=field.name type=field.type included=field.included index=field.index }}`);
  assert.equal(this.$('#field-included-1').is(':checked'), true, 'Field Name: test-field');
  run(() => document.getElementById('field-included-1').click());
  assert.equal(this.$('#field-included-1').is(':checked'), false, 'Field Name: new-field');
});