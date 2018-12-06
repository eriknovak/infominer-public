import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('analysis-method-classify-active-learning', 'Integration | Component | analysis method classify active learning', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{analysis-method-classify-active-learning}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#analysis-method-classify-active-learning}}
      template block text
    {{/analysis-method-classify-active-learning}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
