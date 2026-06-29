
        let jumps = 0;
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                jumps++;
                document.getElementById('score').innerText = jumps;
                console.log('Jumped!');
            }
        });
        