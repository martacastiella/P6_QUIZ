const Sequelize = require("sequelize");
const {models} = require("../models");


// Autoload the tip with id equals to :tipId
exports.load = (req, res, next, tipId) => {

    models.tip.findById(tipId)
    .then(tip => {
        if (tip) {
            req.tip = tip;
            next();
        } else {
            next(new Error('There is no tip with tipId=' + tipId));
        }
    })
    .catch(error => next(error));
};


// POST /quizzes/:quizId/tips
exports.create = (req, res, next) => {
 
    const tip = models.tip.build(
        {
            text: req.body.text,
            quizId: req.quiz.id,
            authorId: req.session.user && req.session.user.id || 0
        });

    tip.save({fields: ["text", "quizId", "authorId"]})
    .then(tip => {
        req.flash('success', 'Tip created successfully.');
        res.redirect("back");
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.redirect("back");
    })
    .catch(error => {
        req.flash('error', 'Error creating the new tip: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/tips/:tipId/accept
exports.accept = (req, res, next) => {

    const {tip} = req;

    tip.accepted = true;

    tip.save(["accepted"])
    .then(tip => {
        req.flash('success', 'Tip accepted successfully.');
        res.redirect('/quizzes/' + req.params.quizId);
    })
    .catch(error => {
        req.flash('error', 'Error accepting the tip: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId/tips/:tipId
exports.destroy = (req, res, next) => {

    req.tip.destroy()
    .then(() => {
        req.flash('success', 'tip deleted successfully.');
        res.redirect('/quizzes/' + req.params.quizId);
    })
    .catch(error => next(error));
};

//
exports.adminOrAuthorRequired = (req, res, next) => {

    const isAdmin  = !!req.session.user.isAdmin;
    const isAuthor = req.tip.authorId === req.session.user.id;

    if (isAdmin || isAuthor) {
        next();
    } else {
        console.log('Prohibited operation: The logged in user is not the author of the tip, nor an administrator.');
        res.send(403);
    }
};

// GET /quizzes/:quizId/tips/:tipId/edit
exports.edit = (req, res, next) => {

    const {tip,quiz} = req;
    // también puedo escribir :
        //const tip = req.tip;
        // const quiz = req.quiz;

    res.render('tips/edit', {tip:tip, quiz:quiz});
};


// PUT /quizzes/:quizId/tips/:tipId
exports.update = (req, res, next) => {

    const {quiz, tip, body} = req; //req.body es el cuerpo de la petición con todas las peticiones del formulario

    tip.text = body.text; //body.text viene del name que he puesto en el campo del formulario

    tip.accepted = false; // que el admin vuelva a tener que moderar la pista (accepted)


    tip.save({fields: ["text", "accepted"]}) //no sería necesario meter el campo de texto, podría poner solo paréntesis
        .then(quiz => {
            req.flash('success', 'Tip edited successfully.');
            res.redirect('/goback'); // me va a una página principal, si no podría hacer un redirect.('/back'); para volver a donde estaba
        })
        .catch(Sequelize.ValidationError, error => {
            req.flash('error', 'There are errors in the form:');
            error.errors.forEach(({message}) => req.flash('error', message));
            res.render('tips/edit', {tip,quiz});
        })
        .catch(error => {
            req.flash('error', 'Error editing the Tip: ' + error.message);
            next(error);
        });
};



