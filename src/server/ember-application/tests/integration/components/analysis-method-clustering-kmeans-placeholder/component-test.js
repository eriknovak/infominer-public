import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('analysis-method-clustering-kmeans-placeholder', 'Integration | Component | analysis method clustering kmeans placeholder', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{analysis-method-clustering-kmeans-placeholder}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#analysis-method-clustering-kmeans-placeholder}}
      template block text
    {{/analysis-method-clustering-kmeans-placeholder}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
