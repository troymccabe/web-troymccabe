<?php
require_once __DIR__ . '/../vendor/autoload.php';

$app = new Silex\Application();

$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__ . '/../views',
));

$app->register(new Silex\Provider\HttpCacheServiceProvider(), array(
    'http_cache.cache_dir' => __DIR__.'/cache/',
));

$app['request_uri'] = $_SERVER['REQUEST_URI'];


/*
 * GET Routes
 */
$app->get('/', function() use ($app) {
    $date1 = new \DateTime('April 1, 1988');
    $date2 = new \DateTime();
    $diff = $date1->diff($date2);
    return $app['twig']->render('index.twig', array('age' => $diff->format('%y')));
});

$app->get('/blog/', function() use ($app) {
    return $app['twig']->render('blog.twig');
});

$app->get('/projects/', function() use ($app) {
    return $app['twig']->render('projects.twig');
});

$app->get('/projects/eq_reps/', function() use ($app) {
    return $app['twig']->render('eq_reps.twig');
});

$app->get('/resume/', function() use ($app) {
    return $app['twig']->render('resume.twig');
});
/*
 * /GET Routes
 */

$app['http_cache']->run();