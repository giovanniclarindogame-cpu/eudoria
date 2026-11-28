import bpy,math,mathutils,json,sys
A=json.loads(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv else {}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='/tmp/claude-0/fant3d2/boneco2.glb')
sc=bpy.context.scene
for o in list(bpy.data.objects):
    if o.name=='Icosphere':bpy.data.objects.remove(o)
arm=[o for o in bpy.data.objects if o.type=='ARMATURE'][0];PB=arm.pose.bones
me=[o for o in bpy.data.objects if o.type=='MESH'][0]
# contorno só para a câmera
mo=bpy.data.materials.new('contorno');mo.use_nodes=True;nt=mo.node_tree;nt.nodes.clear()
out=nt.nodes.new('ShaderNodeOutputMaterial');mix=nt.nodes.new('ShaderNodeMixShader');geo=nt.nodes.new('ShaderNodeNewGeometry');lp=nt.nodes.new('ShaderNodeLightPath')
tr=nt.nodes.new('ShaderNodeBsdfTransparent');em=nt.nodes.new('ShaderNodeEmission');em.inputs[0].default_value=(.06,.03,.02,1)
inv=nt.nodes.new('ShaderNodeMath');inv.operation='SUBTRACT';inv.inputs[0].default_value=1;mul=nt.nodes.new('ShaderNodeMath');mul.operation='MULTIPLY'
nt.links.new(geo.outputs['Backfacing'],inv.inputs[1]);nt.links.new(inv.outputs[0],mul.inputs[0]);nt.links.new(lp.outputs['Is Camera Ray'],mul.inputs[1])
nt.links.new(mul.outputs[0],mix.inputs[0]);nt.links.new(tr.outputs[0],mix.inputs[1]);nt.links.new(em.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],out.inputs[0])
me.data.materials.append(mo);so=me.modifiers.new('contorno','SOLIDIFY');so.thickness=.009;so.use_flip_normals=True;so.material_offset=len(me.data.materials)-1;so.offset=1
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=A.get('zoom',1.08);sc.camera=cam
az,el=math.radians(A.get('az',-18)),math.radians(A.get('el',18))
bpy.ops.object.light_add(type='SUN');s1=bpy.context.object;s1.data.energy=A.get('sol',6);s1.rotation_euler=(math.radians(45),0,math.radians(-35))
bpy.ops.object.light_add(type='SUN');s2=bpy.context.object;s2.data.energy=1.2;s2.rotation_euler=(math.radians(70),0,math.radians(150))
w=bpy.data.worlds.new('w');sc.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs[1].default_value=A.get('ceu',1.6)
sc.render.engine='CYCLES';sc.cycles.samples=A.get('amostras',32);sc.render.film_transparent=True;sc.render.resolution_x=sc.render.resolution_y=A.get('res',256);sc.view_settings.view_transform='Standard'
SEG=A['seg'];EXTRA=A.get('extra',{})
act=arm.animation_data.action
for b in PB:b.rotation_mode='QUATERNION'
def reforco(nome,i):
    # copia a pose da animação, desliga a animação e soma rotações extras (em graus, eixo local do osso)
    pose={b.name:(b.location.copy(),b.rotation_quaternion.copy()) for b in PB}
    arm.animation_data.action=None
    for b in PB:b.location,b.rotation_quaternion=pose[b.name]
    bpy.context.view_layer.update()
    # rotações no espaço do mundo (eixos fixos: x = esquerda do boneco, -y = frente, z = cima), girando em torno da cabeça do osso
    for osso,eixo,graus in EXTRA.get(nome,[[]]*6)[i]:
        pb=PB[osso];piv=pb.head.copy()
        R=mathutils.Matrix.Rotation(math.radians(graus),4,eixo)
        pb.matrix=mathutils.Matrix.Translation(piv)@R@mathutils.Matrix.Translation(-piv)@pb.matrix
        bpy.context.view_layer.update()
for nome,frames in SEG.items():
    for i,f in enumerate(frames):
        arm.animation_data.action=act;sc.frame_set(f)
        if nome in EXTRA:reforco(nome,i)
        h=arm.matrix_world@PB['mixamorig:Hips'].head
        if nome=='morte':h=mathutils.Vector((A['hx'],A['hy'],0))   # na queda a câmera não acompanha
        alvo=mathutils.Vector((h.x,h.y,.47))
        cam.location=alvo+mathutils.Vector((6*math.cos(el)*math.sin(az),-6*math.cos(el)*math.cos(az),6*math.sin(el)))
        cam.rotation_euler=(alvo-cam.location).to_track_quat('-Z','Y').to_euler()
        sc.render.filepath=f'/tmp/claude-0/fant3d2/q/{nome}_{i}.png';bpy.ops.render.render(write_still=True)
