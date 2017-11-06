import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('datasets', function() {});
  this.route('dataset', { path: '/dataset/:dataset_id' });
});

export default Router;
