const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const supabase = require('../helpers/supabaseClient');
const questionsRouter = express.Router();

questionsRouter.use(bodyParser.json());

// get all question
questionsRouter.get('/questions', async (req, res) => {
    // Fetch questions with their associated tags
    const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select(`
            *,
            questiontags (
                tag_id,
                tags (tag_name)
            )
        `);

    if (questionsError) {
        return res.status(500).json({ error: questionsError.message });
    }

    // Transform the data to include tags as an array of tag names
    const formattedQuestions = questions.map(question => ({
        ...question,
        tags: question.questiontags.map(qt => qt.tags.tag_name)
    }));

    res.json(formattedQuestions);
});

// get a question
questionsRouter.get('/questions/:id', async (req, res) => {
    const questionId = req.params.id;
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('question_id', questionId);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
});

// get solution to a question
questionsRouter.get('/questions/:question_id/solution', async (req, res) => {
    const { question_id } = req.params;
    
    const { data, error } = await supabase
        .from('solutions')
        .select('*')
        .eq('question_id', question_id)
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
});

// get all questions with a tag
questionsRouter.get('/questions/tag/:tag_name', async (req, res) => {
    const { tag_name } = req.params;

    // Get the tag_id based on tag_name
    const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('tag_id')
        .eq('tag_name', tag_name)
        .single();

    if (tagError) {
        return res.status(500).json({ error: tagError.message });
    }

    const { tag_id } = tagData;

    // Get all question_ids with the tag_id
    const { data: questionTagData, error: questionTagError } = await supabase
        .from('questiontags')
        .select('question_id')
        .eq('tag_id', tag_id);

    if (questionTagError) {
        return res.status(500).json({ error: questionTagError.message });
    }

    const questionIds = questionTagData.map(qt => qt.question_id);

    // Get all questions with these question_ids
    const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('question_id', questionIds);

    if (questionsError) {
        return res.status(500).json({ error: questionsError.message });
    }

    res.json(questionsData);
});


// create a question
questionsRouter.post('/questions', async (req, res) => {
    const { question_text, question_image, choice_a, choice_b, choice_c, choice_d, choice_e, correct_choice, difficulty, category, date_created, solutions, tags } = req.body;

    if (!question_text) {
        return res.status(400).json({ error: 'question_text is required' });
    }

    const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .insert([{
            question_text,
            question_image,
            choice_a,
            choice_b,
            choice_c,
            choice_d,
            choice_e,
            correct_choice,
            difficulty,
            category,
            date_created
        }])
        .select()
        .single();

    if (questionError) {
        return res.status(500).json({ error: questionError.message });
    }

    const question_id = questionData.question_id;

    for (const solution of solutions) {
        const { error: solutionError } = await supabase
            .from('solutions')
            .insert([{
                question_id,
                solution_text: solution.solution_text,
                solution_image: solution.solution_image,
                explanation: solution.explanation
            }]);

        if (solutionError) {
            return res.status(500).json({ error: solutionError.message });
        }
    }

    for (const tag_name of tags) {
        console.log('Processing tag:', tag_name);
    
        let { data: tagData, error: tagError } = await supabase
            .from('tags')
            .select('tag_id')
            .eq('tag_name', tag_name)
            .single();
    
        if (tagError) {
            console.error('Tag retrieval error:', tagError);
            // return res.status(500).json({ error: tagError.message });
        }

        console.log(tagData)
        if (!tagData) {
            console.log('Tag not found, inserting:', tag_name);
            const { data: newTagData, error: newTagError } = await supabase
                .from('tags')
                .insert([{ tag_name }])
                .select()
                .single();
    
            if (newTagError) {
                console.error('New tag insertion error:', newTagError);
                return res.status(500).json({ error: newTagError.message });
            }
    
            tagData = newTagData;
        }
    
        console.log('Linking tag to question:', tagData.tag_id);
        const { error: questionTagError } = await supabase
            .from('questiontags')
            .insert([{
                question_id,
                tag_id: tagData.tag_id
            }]);
    
        if (questionTagError) {
            console.error('Question-Tag linking error:', questionTagError);
            return res.status(500).json({ error: questionTagError.message });
        }
    }  
    // return res.status(500).json({ error: questionTagError.message });
    res.status(201).json({ question_id });
});

// delete a question and its solution
questionsRouter.delete('/questions/:question_id', async (req, res) => {
    const { question_id } = req.params;

    // Delete solution(s) associated with the question
    const { error: deleteSolutionsError } = await supabase
        .from('solutions')
        .delete()
        .eq('question_id', question_id);

    if (deleteSolutionsError) {
        return res.status(500).json({ error: deleteSolutionsError.message });
    }

    // Delete the question
    const { error: deleteQuestionError } = await supabase
        .from('questions')
        .delete()
        .eq('question_id', question_id);

    if (deleteQuestionError) {
        return res.status(500).json({ error: deleteQuestionError.message });
    }

    res.status(204).send();
});

module.exports = questionsRouter;
