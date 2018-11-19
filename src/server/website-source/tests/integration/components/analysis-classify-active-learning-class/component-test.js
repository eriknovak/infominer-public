import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('analysis-classify-active-learning-class', 'Integration | Component | analysis classify active learning class', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{analysis-classify-active-learning-class}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#analysis-classify-active-learning-class}}
      template block text
    {{/analysis-classify-active-learning-class}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
