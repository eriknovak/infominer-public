import Route from '@ember/routing/route';
import $ from 'jquery';

export default Route.extend({

    model(params) {
        // set a on scroll listener
        $(window).on('scroll', function () {
            // change display if the user scrolled down enough
            let display = $(document).scrollTop() > 500  ? 'block' : 'none';
            $('#go-to-top').css('display', display);
        });
        // get the subset info
        return this.get('store').findRecord('subset', params.subset_id);
    },

    actions: {
        /**
         * Submits the changes to the subset information.
         */
        submitSubsetInfo() {
            // get subset label and description
            let label = $('#edit-subset-modal input').val();
            let description = $('#edit-subset-modal textarea').val();

            // get warning and clean container
            let warningContent = $('#edit-subset-modal div.warning');
            warningContent.empty();

            if (label.length === 0) {
                // TODO: handle data omitence
                warningContent.append('<p class="warning-content">Subset label must be given!</p>');
            } else {
                // get the current subset
                let subset = this.modelFor(this.routeName);

                // set the subset information
                subset.set('label', label);
                subset.set('description', description);

                // save the subset for persistance
                subset.save();
                $('#edit-subset-modal').modal('toggle');
            }
        },
        /**
         * Removes the warning message within the subset creation model
         */
        removeModalWarnings() {
            // get warning container
            let warningContent = $('#edit-subset-modal div.warning');
            // empty warning container
            warningContent.empty();
        },

        /**
         * Moves the window to the top of the page, smoothly.
         */
        backToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

    }

});
