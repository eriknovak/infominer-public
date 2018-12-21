import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('datasets');
  this.route('dataset-upload');
  this.route('dataset', { path: '/datasets/:dataset_id' }, function() {
    this.route('subsets');
    this.route('subset', { path: '/subsets/:subset_id' }, function() {
      this.route('documents', { path: '/documents' });
      this.route('analysis');
    });
  });
  this.route('active-learning', { path: '/dataset/:dataset_id/subsets/:subset_id/active-learning' });
});

export default Router;
