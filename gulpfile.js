var gulp = require('gulp');
var livereload = require('gulp-livereload');
var htmlmin = require('gulp-htmlmin');
var uglify = require('gulp-uglify');

gulp.task('watch', function(){
    livereload.listen();
    gulp.watch('app/**/*.*', function(file){
        livereload.changed(file.path);
    });
});

gulp.task('html', function(){
    gulp.src('app/src/*.html')
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true
        }))
        .pipe(gulp.dest('app/dist'));
});

gulp.task('jsmin', function () {
   gulp.src('app/src/assets/js/*.js')
       .pipe(uglify())
       .pipe(gulp.dest('app/dist/assets/js'));
});
