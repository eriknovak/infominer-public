import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('anaysis-clustering-kmeans-cluster', 'Integration | Component | anaysis clustering kmeans cluster', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{anaysis-clustering-kmeans-cluster}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#anaysis-clustering-kmeans-cluster}}
      template block text
    {{/anaysis-clustering-kmeans-cluster}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
