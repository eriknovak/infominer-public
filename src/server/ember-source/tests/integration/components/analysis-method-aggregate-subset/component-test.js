import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('analysis-method-aggregate-subset', 'Integration | Component | analysis method aggregate subset', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{analysis-method-aggregate-subset}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#analysis-method-aggregate-subset}}
      template block text
    {{/analysis-method-aggregate-subset}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
