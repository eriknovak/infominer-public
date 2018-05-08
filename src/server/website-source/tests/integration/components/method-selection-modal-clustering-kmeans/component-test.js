import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('method-selection-modal-clustering-kmeans', 'Integration | Component | method selection modal clustering kmeans', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{method-selection-modal-clustering-kmeans}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#method-selection-modal-clustering-kmeans}}
      template block text
    {{/method-selection-modal-clustering-kmeans}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
