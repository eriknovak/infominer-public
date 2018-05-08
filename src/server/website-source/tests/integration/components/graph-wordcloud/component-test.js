import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('graph-wordcloud', 'Integration | Component | graph wordcloud', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{graph-wordcloud}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#graph-wordcloud}}
      template block text
    {{/graph-wordcloud}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
