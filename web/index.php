<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config.php';

$app = new Silex\Application();

$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__ . '/../views',
));

$app['request_uri'] = $_SERVER['REQUEST_URI'];

$pdo = new PDO("mysql:dbname={$_config['mysql']['db']};host={$_config['mysql']['host']}",
    $_config['mysql']['user'], $_config['mysql']['pass']);

/*
 * GET Routes
 */
$app->get('/', function() use ($app) {
    return $app['twig']->render('index.twig');
});

$app->get('/projects/', function() use ($app) {
    return $app['twig']->render('projects.twig');
});

$app->get('/resume/', function() use ($app) {
    return $app['twig']->render('resume.twig');
});
/*
 * /GET Routes
 */


$app->run();