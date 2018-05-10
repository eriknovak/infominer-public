import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('analysis-method-visualization-placeholder', 'Integration | Component | analysis method visualization placeholder', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{analysis-method-visualization-placeholder}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#analysis-method-visualization-placeholder}}
      template block text
    {{/analysis-method-visualization-placeholder}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
