                    formatter: function(text, op) {
                        return [text, op.value ? '$' + (op.value / 1000000).toFixed(0) + 'M' : ''];
                    }
                },
                plotOptions: {
                    treemap: {
                        distributed: true,
                        enableShades: false
                    }
                }
            };
            
            if (window.decisionTreeChart) {
                window.decisionTreeChart.destroy();
            }
            
            window.decisionTreeChart = new ApexCharts(treeEl, options);
            window.decisionTreeChart.render();
        }
        
        // Generate tree data based on type
        function generateTreeData(type) {
            const bestPath = mctsResults.bestPath;
            
            if (type === 'best') {
                return bestPath.map(action => ({
                    x: action.type.replace(/_/g, ' '),
                    y: action.cost * 1000000
                }));
            } else if (type === 'alternatives') {
                return mctsResults.scenarios.slice(0, 5).map((scenario, i) => ({
                    x: `Scenario ${i + 1}`,
                    y: scenario.value
                }));
            } else {
                return Object.entries(mctsResults.riskProbabilities).map(([risk, stats]) => ({
                    x: risk.replace(/_/g, ' '),
                    y: stats.mean * 100
                }));
            }
        }
        
        // Show Decision Tree
        function showDecisionTree(type) {
            const parentEl = document.getElementById('decisionTreeChart').parentElement.parentElement;
            createDecisionTree(type);
            
            // Update button states
            parentEl.querySelectorAll('.chart-action').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
        }
        
        // Update Sankey filter (modified for MCTS)
        function updateSankey(filter) {
            if (filter === 'current') {
                // Show current state
                initializeSankey();
            } else if (['3M', '6M', '12M', '24M'].includes(filter)) {
                // MCTS time-based projections
                if (!mctsAnalyzer) {
                    alert('Please run MCTS simulation first');
                    return;
                }
                updateSankeyWithMCTS(filter);
            }
        }
        
        // Original Sankey function (renamed)
        function updateSankeyOriginal(filter) {